import { responder } from "@/lib/agente/agente";
import { validarCorpo } from "@/lib/agente/entrada";
import { responderLLM, usarLLM } from "@/lib/agente/llm";
import { registrar } from "@/lib/agente/registro";
import type { Trace } from "@/lib/agente/tipos";

export async function POST(req: Request) {
  let corpo: unknown;
  try {
    corpo = await req.json();
  } catch {
    return Response.json({ erro: "Corpo inválido." }, { status: 400 });
  }
  const entrada = validarCorpo(corpo);
  if (!entrada.ok) return Response.json({ erro: entrada.erro }, { status: 400 });

  let trace: Trace;
  if (usarLLM(entrada.valor.versao)) {
    try {
      trace = await responderLLM(entrada.valor);
    } catch (erro) {
      // Provedor fora do ar, sem crédito ou chave inválida: a loja continua no modo demo, e o trace diz por quê.
      const status = erro instanceof Error && "status" in erro ? ` (HTTP ${String(erro.status)})` : "";
      console.error(`modo LLM falhou${status}; respondendo no modo demo`);
      trace = responder(entrada.valor);
      trace.passos.unshift({ tipo: "modelo", nome: "modelo_indisponivel", detalhe: `Modo LLM falhou${status}; resposta do modo demo.`, status: "alerta", ms: 0 });
    }
  } else {
    trace = responder(entrada.valor);
  }
  registrar(trace, "site");
  return Response.json(trace);
}
