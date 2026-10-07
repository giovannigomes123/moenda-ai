import type { Mensagem } from "@/lib/agente/tipos";
import { VERSOES } from "@/lib/agente/versoes";

export const LIMITE_FALA = 600;
export const LIMITE_HISTORICO = 8;

export type EntradaValida = { fala: string; historico: Mensagem[]; versao?: string };

/** Valida o corpo de /api/chat. Entrada externa: nada passa sem tipo, enum e tamanho conferidos. */
export function validarCorpo(corpo: unknown): { ok: true; valor: EntradaValida } | { ok: false; erro: string } {
  if (!corpo || typeof corpo !== "object") return { ok: false, erro: "Corpo inválido." };
  const c = corpo as Record<string, unknown>;
  if (typeof c.fala !== "string") return { ok: false, erro: "Escreva uma mensagem." };
  const fala = c.fala.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").trim().slice(0, LIMITE_FALA);
  if (!fala) return { ok: false, erro: "Escreva uma mensagem." };
  const versao = typeof c.versao === "string" && VERSOES.some((v) => v.id === c.versao) ? c.versao : undefined;
  const historico: Mensagem[] = [];
  if (Array.isArray(c.historico)) {
    for (const m of c.historico.slice(-LIMITE_HISTORICO)) {
      if (!m || typeof m !== "object") continue;
      const { papel, texto } = m as Record<string, unknown>;
      if ((papel !== "cliente" && papel !== "assistente") || typeof texto !== "string") continue;
      historico.push({ papel, texto: texto.slice(0, LIMITE_FALA) });
    }
  }
  return { ok: true, valor: { fala, historico, versao } };
}
