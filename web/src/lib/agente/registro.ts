import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { Trace } from "@/lib/agente/tipos";
import { mascararDadosPessoais } from "@/lib/agente/travas";

// Traces em JSONL local (fora do git). Simples de propósito: dá para trocar por Langfuse/OTel depois.
// Conversas do site e rodadas de eval ficam em arquivos separados: a eval é regravada a cada rodada.
const PASTA = path.join(process.cwd(), ".dados");
const SITE = path.join(PASTA, "traces.jsonl");
const EVAL = path.join(PASTA, "traces-eval.jsonl");

export type Origem = "site" | "eval";
export type TraceRegistrado = Trace & { origem: Origem };

/** Segunda camada: mesmo que algum caminho do agente esqueça, o que vai para o disco sai mascarado. */
export function sanitizar(trace: Trace): Trace {
  return { ...trace, fala: mascararDadosPessoais(trace.fala).texto, resposta: mascararDadosPessoais(trace.resposta).texto };
}

export function registrar(trace: Trace, origem: Origem = "site") {
  mkdirSync(PASTA, { recursive: true });
  appendFileSync(origem === "site" ? SITE : EVAL, JSON.stringify({ ...sanitizar(trace), origem }) + "\n", "utf-8");
}

export function regravarEval(traces: Trace[]) {
  mkdirSync(PASTA, { recursive: true });
  writeFileSync(EVAL, traces.map((t) => JSON.stringify({ ...sanitizar(t), origem: "eval" })).join("\n") + "\n", "utf-8");
}

// Linha corrompida (escrita interrompida, edição manual) não derruba a página: é ignorada.
const ler = (arquivo: string): TraceRegistrado[] => {
  if (!existsSync(arquivo)) return [];
  const out: TraceRegistrado[] = [];
  for (const linha of readFileSync(arquivo, "utf-8").split("\n")) {
    if (!linha) continue;
    try {
      out.push(JSON.parse(linha));
    } catch {
      // ignora
    }
  }
  return out;
};

export function lerTraces(): TraceRegistrado[] {
  return [...ler(EVAL), ...ler(SITE)];
}
