// Preço por milhão de tokens (US$). Usado no custo dos traces e no simulador de troca de modelo.
// Conferir as fontes antes de publicar números: os preços mudam.
export type PrecoModelo = { id: string; nome: string; entrada: number; saida: number; fonte: string };

export const MODELOS: PrecoModelo[] = [
  { id: "claude-haiku-4-5", nome: "Claude Haiku 4.5", entrada: 1, saida: 5, fonte: "anthropic.com/pricing" },
  { id: "claude-sonnet-5", nome: "Claude Sonnet 5", entrada: 2, saida: 10, fonte: "anthropic.com/pricing" },
  { id: "claude-sonnet-5-5", nome: "Claude Sonnet 5.5", entrada: 2, saida: 10, fonte: "anthropic.com/pricing" },
  { id: "claude-opus-5-5", nome: "Claude Opus 5.5", entrada: 4, saida: 20, fonte: "anthropic.com/pricing" },
  { id: "gpt-6-luna", nome: "GPT-6 Luna", entrada: 0.1, saida: 0.5, fonte: "developers.openai.com/api/docs/pricing" },
  { id: "gpt-6.1-sol", nome: "GPT-6.1 Sol", entrada: 2, saida: 10, fonte: "developers.openai.com/api/docs/pricing" },
  { id: "gpt-6-astra", nome: "GPT-6 Astra", entrada: 10, saida: 50, fonte: "developers.openai.com/api/docs/pricing" },
  { id: "gemini-2.5-flash", nome: "Gemini 2.5 Flash", entrada: 0.3, saida: 2.5, fonte: "openrouter.ai" },
  { id: "gemini-3.5-flash", nome: "Gemini 3.5 Flash", entrada: 1.5, saida: 9, fonte: "openrouter.ai" },
];

export const MODELO_REFERENCIA = MODELOS[0];

export function custo(modeloId: string, entrada: number, saida: number) {
  // A API devolve o id servido (pode vir com sufixo de data): casa pelo prefixo.
  // Id mais longo primeiro: "claude-sonnet-5-5" não pode casar com "claude-sonnet-5".
  const porTamanho = [...MODELOS].sort((a, b) => b.id.length - a.id.length);
  const m = porTamanho.find((x) => modeloId === x.id || modeloId.startsWith(`${x.id}-`)) ?? MODELO_REFERENCIA;
  return (entrada * m.entrada + saida * m.saida) / 1_000_000;
}

/** Estimativa grosseira usada no modo demo (sem modelo): ~4 caracteres por token. */
export const estimarTokens = (texto: string) => Math.ceil(texto.length / 4);
