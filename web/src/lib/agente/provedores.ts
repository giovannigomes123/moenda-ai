import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import type { ResponseInputItem } from "openai/resources/responses/responses";

// O laço do agente (llm.ts) não sabe qual provedor está do outro lado: fala com uma Conversa.
// Cada adaptador guarda o histórico no formato do seu provedor e devolve sempre a mesma Volta.

export type Provedor = "anthropic" | "openai";
export type MensagemSimples = { role: "user" | "assistant"; content: string };
export type ChamadaFerramenta = { id: string; nome: string; entrada: unknown };
export type ResultadoParaModelo = { id: string; conteudo: string; erro: boolean };

export type Volta = {
  modelo: string; // id que o provedor diz ter servido
  entrada: number;
  saida: number;
  parada: string; // stop_reason / status do provedor, para o trace
  recusou: boolean;
  continuar: boolean; // pausa do servidor: mandar de novo sem resultado de ferramenta
  texto: string;
  chamadas: ChamadaFerramenta[];
};

export interface Conversa {
  enviar(): Promise<Volta>;
  devolver(resultados: ResultadoParaModelo[]): void;
}

export type FerramentaNeutra = { name: string; description: string; input_schema: Record<string, unknown> };
export type AbrirConversa = (opcoes: { modelo: string; sistema: string; mensagens: MensagemSimples[]; ferramentas: FerramentaNeutra[] }) => Conversa;

/** MOENDA_PROVEDOR manda; sem ele, usa o provedor cuja chave existe (Anthropic se houver as duas). */
export function provedorLLM(): Provedor {
  const p = process.env.MOENDA_PROVEDOR?.trim().toLowerCase();
  if (p === "openai" || p === "anthropic") return p;
  return !process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN && process.env.OPENAI_API_KEY ? "openai" : "anthropic";
}

export const MODELO_PADRAO: Record<Provedor, string> = { anthropic: "claude-opus-5-5", openai: "gpt-6.1-sol" };

export const abrirAnthropic: AbrirConversa = ({ modelo, sistema, mensagens, ferramentas }) => {
  const cliente = new Anthropic();
  const historico: Anthropic.Beta.BetaMessageParam[] = mensagens.map((m) => ({ ...m }));
  // strict: o esquema é garantido pela API; additionalProperties: false é obrigatório.
  const tools: Anthropic.Beta.BetaTool[] = ferramentas.map((f) => ({ ...f, strict: true, input_schema: f.input_schema as Anthropic.Beta.BetaTool.InputSchema }));
  return {
    async enviar() {
      const r = await cliente.beta.messages.create({
        model: modelo,
        max_tokens: 4000,
        system: sistema,
        tools,
        messages: historico,
        output_config: { effort: "low" }, // tarefa de balcão: pouco raciocínio, resposta rápida
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default", // recusa do modelo é refeita no servidor por outro modelo
      });
      historico.push({ role: "assistant", content: r.content });
      return {
        modelo: r.model,
        entrada: r.usage.input_tokens + (r.usage.cache_read_input_tokens ?? 0) + (r.usage.cache_creation_input_tokens ?? 0),
        saida: r.usage.output_tokens,
        parada: r.stop_reason ?? "?",
        recusou: r.stop_reason === "refusal",
        continuar: r.stop_reason === "pause_turn",
        texto: r.content.filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text").map((b) => b.text).join("\n").trim(),
        chamadas: r.stop_reason === "tool_use" ? r.content.filter((b) => b.type === "tool_use").map((b) => ({ id: b.id, nome: b.name, entrada: b.input })) : [],
      };
    },
    devolver(resultados) {
      historico.push({
        role: "user",
        content: resultados.map((r) => ({ type: "tool_result" as const, tool_use_id: r.id, content: r.conteudo, is_error: r.erro })),
      });
    },
  };
};

/** Argumentos da OpenAI chegam como texto JSON: inválido vira objeto vazio, e a ferramenta responde com erro. */
export function lerArgumentos(texto: string): unknown {
  try {
    return JSON.parse(texto);
  } catch {
    return {};
  }
}

// Responses API. strict fica desligado: no modo estrito da OpenAI todo campo precisa ser obrigatório, e aqui os filtros
// são opcionais. A entrada é validada de novo em executarFerramenta de qualquer jeito.
// O cliente é parâmetro para o teste trocar só a fronteira HTTP (fetch), com o SDK de verdade.
export const abrirOpenAICom = (cliente: OpenAI): AbrirConversa => ({ modelo, sistema, mensagens, ferramentas }) => {
  const entrada: ResponseInputItem[] = mensagens.map((m) => ({ role: m.role, content: m.content }));
  const tools = ferramentas.map((f) => ({ type: "function" as const, name: f.name, description: f.description, parameters: f.input_schema, strict: false }));
  return {
    async enviar() {
      const r = await cliente.responses.create({
        model: modelo,
        instructions: sistema,
        input: entrada,
        tools,
        reasoning: { effort: "low" },
        max_output_tokens: 4000,
        // Nada fica guardado na OpenAI; o raciocínio volta cifrado para a próxima chamada do laço.
        store: false,
        include: ["reasoning.encrypted_content"],
      });
      // Itens de saída (raciocínio, chamadas, mensagem) voltam no histórico, como a API pede.
      entrada.push(...(r.output as ResponseInputItem[]));
      const chamadas = r.output.filter((o) => o.type === "function_call").map((o) => ({ id: o.call_id, nome: o.name, entrada: lerArgumentos(o.arguments) }));
      const recusou =
        r.output.some((o) => o.type === "message" && o.content.some((c) => c.type === "refusal")) || r.incomplete_details?.reason === "content_filter";
      return {
        modelo: r.model,
        entrada: r.usage?.input_tokens ?? 0,
        saida: r.usage?.output_tokens ?? 0,
        parada: chamadas.length ? "function_call" : [r.status, r.incomplete_details?.reason].filter(Boolean).join(":") || "?",
        recusou,
        continuar: false,
        texto: r.output_text.trim(),
        chamadas,
      };
    },
    devolver(resultados) {
      for (const r of resultados) {
        entrada.push({ type: "function_call_output", call_id: r.id, output: r.erro ? `ERRO: ${r.conteudo}` : r.conteudo });
      }
    },
  };
};

export const abrirOpenAI: AbrirConversa = (opcoes) => abrirOpenAICom(new OpenAI())(opcoes);

export const ABRIR: Record<Provedor, AbrirConversa> = { anthropic: abrirAnthropic, openai: abrirOpenAI };
