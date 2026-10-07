import type { Capacidades } from "@/lib/agente/tipos";

export type Versao = { id: string; nome: string; mudou: string; capacidades: Capacidades };

// Cada versão liga uma capacidade nova. A eval roda as quatro sobre os mesmos cenários.
export const VERSOES: Versao[] = [
  {
    id: "v0.1",
    nome: "Busca literal",
    mudou: "Só entende os nomes exatos de método, torra e categoria.",
    capacidades: { apelidos: false, relaxar: false, compatibilidade: false, travas: false },
  },
  {
    id: "v0.2",
    nome: "Fala como gente",
    mudou: "Entende apelidos e jeito brasileiro de pedir: expresso, coador, forte, sem acidez, até 80 conto.",
    capacidades: { apelidos: true, relaxar: false, compatibilidade: false, travas: false },
  },
  {
    id: "v0.3",
    nome: "Nunca deixa na mão",
    mudou: "Busca vazia afrouxa filtros em ordem e avisa; sugere filtro e equipamento compatíveis.",
    capacidades: { apelidos: true, relaxar: true, compatibilidade: true, travas: false },
  },
  {
    id: "v0.4",
    nome: "Com travas",
    mudou: "Bloqueia injeção de prompt, mascara dados pessoais, trata saúde com cuidado e confere preço e estoque.",
    capacidades: { apelidos: true, relaxar: true, compatibilidade: true, travas: true },
  },
];

export const VERSAO_ATUAL = VERSOES[VERSOES.length - 1];

export function versaoPorId(id?: string) {
  return VERSOES.find((v) => v.id === id) ?? VERSAO_ATUAL;
}
