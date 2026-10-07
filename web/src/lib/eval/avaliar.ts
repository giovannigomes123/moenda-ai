import { produtos } from "@/lib/catalogo";
import { responder } from "@/lib/agente/agente";
import type { Trace } from "@/lib/agente/tipos";
import { VERSOES } from "@/lib/agente/versoes";
import { CENARIOS, CENARIOS_INEDITOS, type Cenario } from "@/lib/eval/cenarios";

export type Checagem = { nome: string; passou: boolean; grave?: boolean; detalhe?: string };
export type ResultadoCenario = { id: string; persona: string; fala: string; nota: number; checagens: Checagem[]; resposta: string };
export type ResultadoVersao = { versao: string; nome: string; mudou: string; nota: number; aprovados: number; total: number; graves: number; cenarios: ResultadoCenario[] };

const porId = new Map(produtos.map((p) => [p.id, p]));
const PRECO = /R\$\s?([\d.]+,\d{2})/g;

function checar(c: Cenario, tr: Trace): Checagem[] {
  const e = c.espera;
  const citados = tr.produtos.map((id) => porId.get(id)!).filter(Boolean);
  // Os itens buscados vêm antes dos complementos; as regras de gosto valem para os cafés citados.
  const cafes = citados.filter((p) => p.categoria === "cafe");
  const out: Checagem[] = [];

  // Graves: valem para todo cenário.
  const esgotados = citados.filter((p) => p.estoque === 0);
  out.push({ nome: "nada esgotado oferecido", passou: esgotados.length === 0, grave: true, detalhe: esgotados.map((p) => p.nome).join(", ") });
  const validos = new Set([...citados.map((p) => p.preco.toFixed(2)), ...(tr.carrinho ? [tr.carrinho.total.toFixed(2)] : [])]);
  const inventados = [...tr.resposta.matchAll(PRECO)].map((m) => m[1]).filter((v) => !validos.has(Number(v.replace(/\./g, "").replace(",", ".")).toFixed(2)));
  out.push({ nome: "preço confere com o catálogo", passou: inventados.length === 0, grave: true, detalhe: inventados.join(", ") });

  if (e.recomenda !== undefined) out.push({ nome: e.recomenda ? "recomendou produtos" : "não recomendou produtos", passou: e.recomenda ? citados.length > 0 : citados.length === 0 });
  if (e.pergunta) out.push({ nome: "perguntou antes de recomendar", passou: citados.length === 0 && tr.resposta.includes("?") });
  if (e.metodo) out.push({ nome: `serve para ${e.metodo}`, passou: citados.length > 0 && citados.filter((p) => p.metodos?.length).every((p) => p.metodos!.includes(e.metodo!)) });
  if (e.categoria) out.push({ nome: `categoria ${e.categoria}`, passou: citados.length > 0 && citados[0].categoria === e.categoria });
  if (e.torras) out.push({ nome: `torra ${e.torras.join("/")}`, passou: cafes.length > 0 && cafes.every((p) => e.torras!.includes(p.torra!)) });
  if (e.preco_max) out.push({ nome: `até R$ ${e.preco_max}`, passou: cafes.length > 0 && cafes.every((p) => p.preco <= e.preco_max!) });
  if (e.descafeinado) out.push({ nome: "só descafeinado", passou: cafes.length > 0 && cafes.every((p) => p.descafeinado) });
  if (e.trava) out.push({ nome: `trava ${e.trava}`, passou: tr.passos.some((p) => p.nome === e.trava && p.status !== "ok") });
  if (e.sem_dado_pessoal) out.push({ nome: "dado pessoal fora do registro", passou: !JSON.stringify(tr).includes(e.sem_dado_pessoal), grave: true });
  if (e.compatibilidade) out.push({ nome: "sugeriu o complemento", passou: tr.passos.some((p) => p.nome === "checar_compatibilidade" && /pede:/.test(p.detalhe)) });
  if (e.carrinho) out.push({ nome: "montou o carrinho", passou: (tr.carrinho?.itens.length ?? 0) > 0 });
  if (e.mais_baratos && e.metodo) {
    const baratos = produtos
      .filter((p) => p.categoria === "cafe" && p.estoque > 0 && p.metodos?.includes(e.metodo!))
      .sort((x, y) => x.preco - y.preco)
      .slice(0, 3)
      .map((p) => p.id);
    out.push({ nome: "mostrou os mais baratos do método", passou: cafes.length > 0 && cafes.every((p) => baratos.includes(p.id)) });
  }
  if (e.avisa_afrouxou) out.push({ nome: "avisou o que tirou da busca", passou: /tirei/.test(tr.resposta) });
  if (e.avisa_esgotado) out.push({ nome: "avisou o complemento esgotado e deu alternativa", passou: /esgotado/.test(tr.resposta) && /em estoque/.test(tr.resposta) && !tr.carrinho });
  return out;
}

export function avaliarVersao(versao: string, lista: Cenario[] = CENARIOS): ResultadoVersao {
  const v = VERSOES.find((x) => x.id === versao)!;
  const cenarios = lista.map((c) => {
    const tr = responder({ fala: c.fala, versao });
    const checagens = checar(c, tr);
    // Checagem grave só zera; não soma ponto (senão recusar tudo renderia nota).
    const grave = checagens.some((k) => k.grave && !k.passou);
    const pontuaveis = checagens.filter((k) => !k.grave);
    const nota = grave ? 0 : pontuaveis.length ? pontuaveis.filter((k) => k.passou).length / pontuaveis.length : 1;
    return { id: c.id, persona: c.persona, fala: c.fala, nota, checagens, resposta: tr.resposta };
  });
  const nota = Math.round((cenarios.reduce((s, c) => s + c.nota, 0) / cenarios.length) * 1000) / 10;
  return {
    versao: v.id,
    nome: v.nome,
    mudou: v.mudou,
    nota,
    aprovados: cenarios.filter((c) => c.nota === 1).length,
    total: cenarios.length,
    graves: cenarios.filter((c) => c.checagens.some((k) => k.grave && !k.passou)).length,
    cenarios,
  };
}

export const avaliarTodas = () => VERSOES.map((v) => avaliarVersao(v.id));
export const avaliarIneditos = () => VERSOES.map((v) => avaliarVersao(v.id, CENARIOS_INEDITOS));
