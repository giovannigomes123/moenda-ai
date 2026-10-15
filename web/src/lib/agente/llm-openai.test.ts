import OpenAI from "openai";
import { describe, expect, it } from "vitest";
import { responderLLM } from "@/lib/agente/llm";
import { abrirOpenAICom } from "@/lib/agente/provedores";

// Laço do modo LLM com a OpenAI: SDK `openai` de verdade, agente e travas de verdade.
// Trocado só o `fetch` do cliente (fronteira HTTP): devolve respostas roteirizadas da Responses API e guarda o que recebeu.
// Achado da revisão crítica de 15/10: o adaptador OpenAI não tinha teste, e saída cortada virava bolha vazia.

type Corpo = { input: Array<Record<string, unknown>>; tools: Array<Record<string, unknown>>; store?: boolean };

function openaiRoteirizada(respostas: object[]) {
  const recebidos: Corpo[] = [];
  const fetchFalso = async (_url: unknown, init?: { body?: unknown }) => {
    recebidos.push(JSON.parse(String(init?.body)));
    const r = respostas[recebidos.length - 1];
    if (!r) throw new Error("chamada a mais ao provedor");
    return new Response(JSON.stringify(r), { status: 200, headers: { "content-type": "application/json" } });
  };
  const cliente = new OpenAI({ apiKey: "teste", fetch: fetchFalso as never, maxRetries: 0 });
  return { abrir: abrirOpenAICom(cliente), recebidos };
}

const base = { object: "response", created_at: 0, model: "gpt-6.1-sol-2026-09-01", parallel_tool_calls: true, tool_choice: "auto", tools: [] };
const chamadaBusca = {
  ...base,
  id: "resp_1",
  status: "completed",
  output: [
    { type: "reasoning", id: "rs_1", summary: [], encrypted_content: "cifrado" },
    { type: "function_call", id: "fc_1", call_id: "call_1", name: "buscar_produtos", arguments: '{"categoria":"cafe","metodo":"Moka","preco_max":80}', status: "completed" },
  ],
  usage: { input_tokens: 900, output_tokens: 40, total_tokens: 940 },
};
const mensagem = (texto: string) => ({
  ...base,
  id: "resp_2",
  status: "completed",
  output: [{ type: "message", id: "msg_1", role: "assistant", status: "completed", content: [{ type: "output_text", text: texto, annotations: [] }] }],
  usage: { input_tokens: 1200, output_tokens: 60, total_tokens: 1260 },
});

describe("modo LLM com OpenAI (SDK real, HTTP roteirizado)", () => {
  it("chama a ferramenta, devolve o resultado com o call_id certo e soma tokens das duas voltas", async () => {
    const { abrir, recebidos } = openaiRoteirizada([chamadaBusca, mensagem("Pra moka, separei estes cafés.")]);
    const tr = await responderLLM({ fala: "cafe pra moka ate 80 reais, meu email ana@x.com" }, abrir);

    expect(recebidos).toHaveLength(2);
    const [primeira, segunda] = recebidos;
    expect(JSON.stringify(primeira)).not.toContain("ana@x.com"); // dado pessoal não sai daqui
    expect(primeira.store).toBe(false);
    expect(primeira.tools.every((t) => t.strict === false)).toBe(true);
    // 2ª volta: raciocínio e chamada reenviados, mais o resultado ligado ao call_id
    expect(segunda.input.map((i) => i.type ?? i.role)).toEqual(["user", "reasoning", "function_call", "function_call_output"]);
    const saida = segunda.input.at(-1)!;
    expect(saida.call_id).toBe("call_1");
    expect(JSON.parse(String(saida.output)).itens.length).toBeGreaterThan(0);

    expect(tr.modo).toBe("llm");
    expect(tr.resposta).toBe("Pra moka, separei estes cafés.");
    expect(tr.tokens).toEqual({ entrada: 2100, saida: 100, estimado: false });
    expect(tr.custo_usd).toBeCloseTo((2100 * 2 + 100 * 10) / 1_000_000, 9); // preço do GPT-6.1 Sol, id com data
    expect(tr.passos.some((p) => p.nome === "buscar_produtos")).toBe(true);
  });

  it("preço que o modelo inventou é trocado antes de chegar ao cliente", async () => {
    const { abrir } = openaiRoteirizada([chamadaBusca, mensagem("Leve um café por R$ 9,99, é uma pechincha.")]);
    const tr = await responderLLM({ fala: "cafe pra moka ate 80 reais" }, abrir);
    expect(tr.resposta).not.toContain("9,99");
    expect(tr.resposta).toContain("[preço no site]");
  });

  it("saída cortada pelo limite de tokens não vira bolha vazia", async () => {
    const cortada = { ...base, id: "resp_3", status: "incomplete", incomplete_details: { reason: "max_output_tokens" }, output: [{ type: "reasoning", id: "rs_2", summary: [] }], usage: { input_tokens: 800, output_tokens: 4000, total_tokens: 4800 } };
    const { abrir } = openaiRoteirizada([cortada]);
    const tr = await responderLLM({ fala: "cafe pra moka" }, abrir);
    expect(tr.resposta.trim().length).toBeGreaterThan(0);
    expect(tr.passos.some((p) => p.nome === "resposta_vazia")).toBe(true);
  });

  it("filtro de conteúdo da OpenAI conta como recusa", async () => {
    const filtrada = { ...base, id: "resp_4", status: "incomplete", incomplete_details: { reason: "content_filter" }, output: [], usage: { input_tokens: 50, output_tokens: 0, total_tokens: 50 } };
    const { abrir } = openaiRoteirizada([filtrada]);
    const tr = await responderLLM({ fala: "cafe pra moka" }, abrir);
    expect(tr.passos.some((p) => p.nome === "recusa_do_modelo")).toBe(true);
    expect(tr.resposta).toMatch(/cafés, equipamentos/);
  });

  it("argumento JSON quebrado não derruba: a ferramenta responde e o laço segue", async () => {
    const quebrada = { ...chamadaBusca, output: [{ ...chamadaBusca.output[1], name: "checar_compatibilidade", arguments: '{"produto_id": "P0' }] };
    const { abrir, recebidos } = openaiRoteirizada([quebrada, mensagem("Qual produto você quer conferir?")]);
    const tr = await responderLLM({ fala: "esse suporte serve no meu filtro?" }, abrir);
    expect(String(recebidos[1].input.at(-1)!.output)).toMatch(/^ERRO:/);
    expect(tr.resposta).toBe("Qual produto você quer conferir?");
  });
});
