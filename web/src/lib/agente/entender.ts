import type { Categoria, Torra } from "@/lib/catalogo";
import type { FiltrosBusca } from "@/lib/agente/ferramentas";

// Entende o pedido em PT-BR e vira filtros de busca. `apelidos=false` é a versão literal (v0.1),
// que só reconhece os nomes exatos do catálogo — a eval mede o ganho de entender gente de verdade.

const norm = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

const METODOS_EXATOS: [RegExp, string][] = [
  [/\bv60\b/, "V60"],
  [/\bchemex\b/, "Chemex"],
  [/\baeropress\b/, "AeroPress"],
  [/\bprensa francesa\b/, "Prensa francesa"],
  [/\bcoado de pano\b/, "Coado de pano"],
  [/\bmoka\b/, "Moka"],
  [/\bespresso\b/, "Espresso"],
];
const METODOS_APELIDOS: [RegExp, string][] = [
  [/\b(hario|coador de papel|filtro de papel|metodo filtrado|pour ?over)\b/, "V60"],
  [/\b(french ?press|prensa)\b/, "Prensa francesa"],
  [/\b(expresso|espresso|maquina de cafe|cafeteira expresso|capsula)\b/, "Espresso"],
  [/\b(italiana|cafeteira italiana|mokinha)\b/, "Moka"],
  [/\b(coador de pano|pano|coado|cafe de vo|cafe da vo|coador)\b/, "Coado de pano"],
  [/\b(aero ?press)\b/, "AeroPress"],
];

const CATEGORIAS: [RegExp, Categoria, string?][] = [
  [/\bmoedor(es)?\b/, "equipamento", "moedor"],
  [/\bchaleira\b/, "equipamento", "chaleira"],
  [/\bbalanca\b/, "equipamento", "balanca"],
  [/\bfiltros?\b(?! de pano)/, "filtro"],
  [/\bkits?\b/, "kit"],
  [/\bassinatura\b/, "assinatura"],
];
const CATEGORIAS_APELIDOS: [RegExp, Categoria, string?][] = [
  // Só o nome do objeto: "café pra moka" é método, "quero o suporte V60" é equipamento.
  [/\b(suporte|dripper|porta.?filtro)\b/, "equipamento", "cafeteira"],
  [/\b(presente|presentear|aniversario|amigo secreto)\b/, "kit"],
  [/\b(todo mes|todo mes|mensal|clube)\b/, "assinatura"],
  [/\b(cafeteira|maquina)\b/, "equipamento", "cafeteira"],
];

const TORRAS_EXATAS: [RegExp, Torra[]][] = [
  [/\btorra clara\b/, ["Clara"]],
  [/\btorra media-clara\b/, ["Média-clara"]],
  [/\btorra media\b/, ["Média"]],
  [/\btorra media-escura\b/, ["Média-escura"]],
  [/\btorra escura\b/, ["Escura"]],
];
// Negação vem antes de tudo: "não quero nada forte" e "não muito amargo" pedem o oposto.
const TORRAS_NEGADAS: [RegExp, Torra[]][] = [
  [/\bnao (?:quero |gosto de |curto )?(?:nada |muito |tao |mto )?(forte|amargo|encorpado|intenso)\b/, ["Clara", "Média-clara", "Média"]],
  [/\bnao (?:quero |gosto de |curto )?(?:nada |muito |tao |mto )?(acido|suave|fraco|aguado)\b/, ["Média", "Média-escura", "Escura"]],
];
const TORRAS_APELIDOS: [RegExp, Torra[]][] = [
  [/\b(forte|encorpado|intenso|amargo(?! nao)|tradicional|de padaria)\b/, ["Média-escura", "Escura"]],
  [/\b(suave|leve|delicado|frutado|floral|acido|acidinho|cha)\b/, ["Clara", "Média-clara"]],
  [/\b(sem acidez|pouca acidez|(nao gosto|odeio|nao curto) de (cafe )?acid\w*|sem ser acido)\b/, ["Média", "Média-escura", "Escura"]],
  [/\b(sem amargor|nada amargo|(nao gosto|odeio|nao curto) de (cafe )?amarg\w*)\b/, ["Clara", "Média-clara", "Média"]],
  [/\b(equilibrado|meio termo|docinho)\b/, ["Média", "Média-clara"]],
];

const NOTAS: [RegExp, string][] = [
  [/\bchocolate\b/, "chocolate"],
  [/\bcaramelo\b/, "caramelo"],
  [/\bcastanha|nozes\b/, "castanhas"],
  [/\bmel\b/, "mel"],
  [/\b(frutas vermelhas|morango|framboesa)\b/, "frutas vermelhas"],
  [/\b(citrico|limao|laranja)\b/, "lim"],
  [/\b(floral|jasmim|flor)\b/, "jasmim"],
  [/\bbaunilha\b/, "baunilha"],
  [/\bcacau\b/, "cacau"],
];

export type Pedido = FiltrosBusca & {
  quer_carrinho: boolean;
  quer_comecar: boolean;
  entendido: string[];
};

export function entender(fala: string, apelidos: boolean): Pedido {
  const f = norm(fala);
  const p: Pedido = { quer_carrinho: false, quer_comecar: false, entendido: [] };

  for (const [re, m] of apelidos ? [...METODOS_EXATOS, ...METODOS_APELIDOS] : METODOS_EXATOS) {
    if (re.test(f)) {
      p.metodo = m;
      p.entendido.push(`método=${m}`);
      break;
    }
  }
  for (const [re, cat, tipo] of apelidos ? [...CATEGORIAS, ...CATEGORIAS_APELIDOS] : CATEGORIAS) {
    if (re.test(f)) {
      p.categoria = cat;
      if (tipo) p.tipo = tipo;
      p.entendido.push(`categoria=${tipo ?? cat}`);
      break;
    }
  }
  // Ordem importa: "sem acidez" antes de "acido". Um descritor afirmativo fora da negação vence:
  // "forte mas não amargo" é forte (sem o extremo), não claro.
  const positivas = apelidos ? [...TORRAS_EXATAS, ...TORRAS_APELIDOS.slice(2), ...TORRAS_APELIDOS.slice(0, 2)] : TORRAS_EXATAS;
  const negada = apelidos ? TORRAS_NEGADAS.find(([re]) => re.test(f)) : undefined;
  const resto = negada ? f.replace(negada[0], " ") : f;
  const afirmada = positivas.find(([re]) => re.test(resto));
  let escolha: Torra[] | undefined;
  if (negada && afirmada) {
    const tiraExtremo = negada[1].includes("Clara") ? afirmada[1].filter((t) => t !== "Escura") : afirmada[1].filter((t) => t !== "Clara");
    escolha = tiraExtremo.length ? tiraExtremo : afirmada[1];
    if (negada[1].includes("Clara") && escolha.every((t) => t === "Média-escura")) escolha = ["Média", "Média-escura"];
  } else {
    escolha = (negada ?? afirmada)?.[1];
  }
  if (escolha) {
    p.torras = escolha;
    p.entendido.push(`torra=${escolha.join("|")}`);
  }
  const notas = NOTAS.filter(([re]) => re.test(f)).map(([, n]) => n);
  if (notas.length) {
    p.notas = notas;
    p.entendido.push(`notas=${notas.join("|")}`);
  }

  // "menos de 500 g" e "até 10 dias" não são preço: unidade depois do número descarta.
  const teto = f.match(/\b(?:ate|no maximo|max|menos de|abaixo de)\s*(?:r\$\s*)?(\d{2,4})(?!\d)(?:,\d{2})?(?!\s*(?:g|kg|gramas?|ml|l|litros?|dias?|horas?|xicaras?|unidades?|un)\b)\s*(?:reais|conto|pila)?/);
  const tetoApelido = apelidos ? f.match(/\b(\d{2,4})\s*(?:conto|pila|reais)\b/) : null;
  const valor = teto?.[1] ?? tetoApelido?.[1];
  if (valor && (teto ? true : apelidos)) {
    p.preco_max = Number(valor);
    p.entendido.push(`preço≤${valor}`);
  } else if (apelidos && /\b(barato|baratinho|em conta|economico|nao custe muito|n custe mt)\b/.test(f)) {
    p.preco_max = 60;
    p.entendido.push("preço≤60 (barato)");
  }
  // Material no pedido de equipamento ("de cerâmica", "de vidro") refina pelo nome.
  const material = apelidos && p.categoria === "equipamento" ? f.match(/\b(ceramica|plastico|vidro|inox)\b/)?.[1] : undefined;
  if (material) {
    p.termo = material;
    p.entendido.push(`material=${material}`);
  }
  if (/\b(descafeinado|sem cafeina|decaf)\b/.test(f)) {
    p.descafeinado = true;
    p.entendido.push("descafeinado");
  }
  if (apelidos && /\b(monta|montar|fecha|fechar|adiciona|coloca)\b.{0,30}\b(carrinho|pedido|kit|tudo)\b/.test(f)) {
    p.quer_carrinho = true;
    p.entendido.push("montar carrinho");
  }
  if (apelidos && /\b(comecar|comecando|iniciante|primeira vez|nunca fiz|do zero)\b/.test(f)) {
    p.quer_comecar = true;
    p.entendido.push("iniciante");
  }
  // "ganhei uma cafeteira italiana, que café compro?": o objeto da compra é o café, não a cafeteira.
  if (apelidos && p.tipo === "cafeteira" && /\b(q|que|qual|quais)\s+cafes?\b|\bcafes?\s+(compro|comprar|uso|usar)\b/.test(f)) {
    p.categoria = "cafe";
    delete p.tipo;
    p.entendido.push("objeto=café");
  }
  // "café coado no filtro de papel": o filtro é o jeito de preparar, o pedido é café.
  if (p.categoria === "filtro" && /\bcafes?\b/.test(f) && !/\b(quero|preciso|comprar|compro|tem|vende)\b.{0,12}\bfiltros?\b/.test(f)) {
    p.categoria = "cafe";
    p.entendido.push("objeto=café");
  }
  if (!p.categoria && (p.torras || p.notas || p.descafeinado || /\bcafes?\b/.test(f))) {
    p.categoria = "cafe";
  }
  return p;
}
