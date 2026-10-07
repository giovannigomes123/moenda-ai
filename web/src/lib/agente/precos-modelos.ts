// Preço por milhão de tokens (US$). Usado no custo dos traces e no simulador de troca de modelo.
// Conferir as fontes antes de publicar números: os preços mudam.
export type PrecoModelo = { id: string; nome: string; entrada: number; saida: number; fonte: string };

export const MODELOS: PrecoModelo[] = [
  { id: "claude-haiku-4-5", nome: "Claude Haiku 4.5", entrada: 1, saida: 5, fonte: "anthropic.com/pricing" },
  { id: "claude-sonnet-5", nome: "Claude Sonnet 5", entrada: 3, saida: 15, fonte: "anthropic.com/pricing" },
  { id: "gemini-2.5-flash", nome: "Gemini 2.5 Flash", entrada: 0.3, saida: 2.5, fonte: "openrouter.ai" },
  { id: "gemini-3.5-flash", nome: "Gemini 3.5 Flash", entrada: 1.5, saida: 9, fonte: "openrouter.ai" },
];

export const MODELO_REFERENCIA = MODELOS[0];

export function custo(modeloId: string, entrada: number, saida: number) {
  const m = MODELOS.find((x) => x.id === modeloId) ?? MODELO_REFERENCIA;
  return (entrada * m.entrada + saida * m.saida) / 1_000_000;
}

/** Estimativa grosseira usada no modo demo (sem modelo): ~4 caracteres por token. */
export const estimarTokens = (texto: string) => Math.ceil(texto.length / 4);
