import dados from "@/data/catalog.json";

export type Torra = "Clara" | "Média-clara" | "Média" | "Média-escura" | "Escura";
export type Categoria = "cafe" | "equipamento" | "filtro" | "kit" | "assinatura";

export type Produto = {
  id: string;
  slug: string;
  categoria: Categoria;
  nome: string;
  marca: string;
  preco: number;
  estoque: number;
  metodos?: string[];
  // café
  origem?: string;
  pais?: string;
  altitude_m?: number;
  variedade?: string;
  processo?: string;
  torra?: Torra;
  notas?: string[];
  pontuacao_sca?: number;
  peso_g?: number;
  forma?: string;
  perfil?: { acidez: number; corpo: number; docura: number };
  descafeinado?: boolean;
  // equipamento, filtro, kit, assinatura
  tipo?: string;
  specs?: Record<string, string | number | boolean>;
  compativel_com?: string;
  itens?: string[];
  descricao?: string;
  frequencia?: string;
};

export const produtos = dados as Produto[];

export const METODOS = ["V60", "Chemex", "AeroPress", "Prensa francesa", "Coado de pano", "Moka", "Espresso"];
export const TORRAS: Torra[] = ["Clara", "Média-clara", "Média", "Média-escura", "Escura"];
export const CATEGORIAS: { id: Categoria; nome: string }[] = [
  { id: "cafe", nome: "Cafés" },
  { id: "equipamento", nome: "Equipamentos" },
  { id: "filtro", nome: "Filtros" },
  { id: "kit", nome: "Kits" },
  { id: "assinatura", nome: "Assinaturas" },
];

export const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function porSlug(slug: string) {
  return produtos.find((p) => p.slug === slug);
}

export type Filtros = { categoria?: string; metodo?: string; torra?: string; ate?: string; q?: string };

export function filtrar(f: Filtros) {
  const teto = f.ate ? Number(f.ate) : undefined;
  const termo = f.q?.toLowerCase().trim();
  return produtos.filter((p) => {
    if (f.categoria && p.categoria !== f.categoria) return false;
    if (f.metodo && !(p.metodos ?? []).includes(f.metodo)) return false;
    if (f.torra && p.torra !== f.torra) return false;
    if (teto && p.preco > teto) return false;
    if (termo) {
      const texto = [p.nome, p.marca, p.origem, p.torra, p.processo, ...(p.notas ?? []), ...(p.metodos ?? [])]
        .join(" ")
        .toLowerCase();
      if (!texto.includes(termo)) return false;
    }
    return true;
  });
}

/** O que combina com um produto: para café, o que prepara nos métodos dele; para cafeteira, filtros e cafés. */
export function combinaCom(p: Produto, limite = 4) {
  const metodos = new Set(p.metodos ?? []);
  const filtroDoProduto = p.specs?.filtro as string | undefined;
  const candidatos = produtos.filter((o) => {
    if (o.id === p.id || o.estoque === 0) return false;
    if (filtroDoProduto && o.categoria === "filtro") return o.compativel_com === filtroDoProduto;
    if (p.categoria === "cafe") return o.categoria === "equipamento" && (o.metodos ?? []).some((m) => metodos.has(m));
    return o.categoria === "cafe" && (o.metodos ?? []).some((m) => metodos.has(m));
  });
  // Filtro compatível primeiro (é o que a pessoa precisa para usar a cafeteira), depois por pontuação.
  const peso = (o: Produto) => (o.categoria === "filtro" ? 1000 : 0) + (o.pontuacao_sca ?? 0);
  return candidatos.sort((a, b) => peso(b) - peso(a)).slice(0, limite);
}
