import { produtos, type Categoria, type Produto, type Torra } from "@/lib/catalogo";

// Ferramentas do agente: funções puras sobre o catálogo. O modo LLM chama as mesmas.

export type FiltrosBusca = {
  categoria?: Categoria;
  tipo?: string;
  metodo?: string;
  torras?: Torra[];
  notas?: string[];
  preco_max?: number;
  descafeinado?: boolean;
  termo?: string;
  limite?: number;
};

export type ResultadoBusca = { itens: Produto[]; total: number; esgotados_ignorados: number };

const norm = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

/** `incluirEsgotados` existe para as versões sem a trava de estoque (a eval mede a diferença). */
export function buscarProdutos(f: FiltrosBusca, opcoes: { incluirEsgotados?: boolean; ordem?: "relevancia" | "preco" } = {}): ResultadoBusca {
  const notas = (f.notas ?? []).map(norm);
  const termo = f.termo ? norm(f.termo) : undefined;
  const casam = produtos.filter((p) => {
    if (f.categoria && p.categoria !== f.categoria) return false;
    if (f.tipo && p.tipo !== f.tipo) return false;
    if (f.metodo && !(p.metodos ?? []).includes(f.metodo)) return false;
    if (f.torras?.length && (!p.torra || !f.torras.includes(p.torra))) return false;
    if (f.preco_max && p.preco > f.preco_max) return false;
    if (f.descafeinado !== undefined && p.categoria === "cafe" && Boolean(p.descafeinado) !== f.descafeinado) return false;
    if (notas.length && !notas.some((n) => (p.notas ?? []).some((x) => norm(x).includes(n)))) return false;
    if (termo && !norm([p.nome, p.marca, p.origem, ...(p.notas ?? [])].join(" ")).includes(termo)) return false;
    return true;
  });
  const disponiveis = opcoes.incluirEsgotados ? casam : casam.filter((p) => p.estoque > 0);
  const relevancia = (p: Produto) =>
    notas.filter((n) => (p.notas ?? []).some((x) => norm(x).includes(n))).length * 10 + (p.pontuacao_sca ?? 0);
  const ordenar = opcoes.ordem === "preco" ? (a: Produto, b: Produto) => a.preco - b.preco : (a: Produto, b: Produto) => relevancia(b) - relevancia(a);
  const itens = disponiveis.sort(ordenar).slice(0, f.limite ?? 3);
  return { itens, total: disponiveis.length, esgotados_ignorados: casam.length - disponiveis.length };
}

export function detalharProduto(id: string) {
  return produtos.find((p) => p.id === id);
}

/** Filtro e equipamento que fazem o produto funcionar (o que falta para usar de verdade). */
export function compativeis(p: Produto, metodoPedido?: string): Produto[] {
  const disp = produtos.filter((o) => o.estoque > 0 && o.id !== p.id);
  const filtro = p.specs?.filtro as string | undefined;
  if (filtro) return disp.filter((o) => o.categoria === "filtro" && o.compativel_com === filtro).slice(0, 1);
  if (p.categoria === "cafe" && p.forma === "Grãos") {
    // O moedor tem que servir para o método que a pessoa pediu (expresso pede moedor de espresso).
    const metodos = new Set(metodoPedido ? [metodoPedido] : (p.metodos ?? []));
    const espresso = metodoPedido === "Espresso" || (metodos.has("Espresso") && metodos.size <= 2);
    return disp
      .filter((o) => o.tipo === "moedor" && (o.metodos ?? []).some((m) => metodos.has(m)) && (!espresso || o.specs?.espresso))
      .sort((a, b) => a.preco - b.preco)
      .slice(0, 1);
  }
  return [];
}

export function checarCompatibilidade(a: Produto, b: Produto): { compativel: boolean; motivo: string } {
  const filtroA = a.specs?.filtro as string | undefined;
  if (filtroA && b.categoria === "filtro") {
    return b.compativel_com === filtroA
      ? { compativel: true, motivo: `${b.nome} é do tamanho ${filtroA}.` }
      : { compativel: false, motivo: `${a.nome} usa filtro ${filtroA}; ${b.nome} é ${b.compativel_com}.` };
  }
  const ma = new Set(a.metodos ?? []);
  const comum = (b.metodos ?? []).filter((m) => ma.has(m));
  return comum.length
    ? { compativel: true, motivo: `Os dois servem para ${comum.join(", ")}.` }
    : { compativel: false, motivo: "Não têm método de preparo em comum." };
}

export function montarCarrinho(ids: string[]) {
  const itens = ids
    .map((id) => produtos.find((p) => p.id === id))
    .filter((p): p is Produto => Boolean(p) && p!.estoque > 0)
    .map((p) => ({ id: p.id, nome: p.nome, preco: p.preco, quantidade: 1 }));
  const total = Math.round(itens.reduce((s, i) => s + i.preco * i.quantidade, 0) * 100) / 100;
  return { itens, total };
}
