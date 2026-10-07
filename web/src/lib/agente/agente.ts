import { brl, type Produto } from "@/lib/catalogo";
import { buscarProdutos, compativeis, montarCarrinho, type FiltrosBusca } from "@/lib/agente/ferramentas";
import { entender } from "@/lib/agente/entender";
import { MODELO_REFERENCIA, custo, estimarTokens } from "@/lib/agente/precos-modelos";
import {
  AVISO_SAUDE,
  MSG_INJECAO,
  conferirEstoque,
  conferirPrecos,
  detectarInjecao,
  mascararDadosPessoais,
  tocaEmSaude,
} from "@/lib/agente/travas";
import type { Mensagem, Passo, Trace } from "@/lib/agente/tipos";
import { versaoPorId } from "@/lib/agente/versoes";

// Instruções que um modelo receberia; no modo demo servem para estimar tokens de entrada.
export const INSTRUCOES = `Você é a assistente da Moenda, loja de café especial. Recomende só produtos do catálogo, \
com preço e estoque vindos das ferramentas. Pergunte o método de preparo quando faltar. Nunca dê orientação médica.`;

export type Entrada = { fala: string; historico?: Mensagem[]; versao?: string };

let seq = 0;
const novoId = () => `t_${Date.now().toString(36)}_${(seq++).toString(36)}`;

function linhaProduto(p: Produto) {
  const sobre = p.notas ? p.notas.join(", ") : p.metodos?.length ? `para ${p.metodos.slice(0, 3).join(", ")}` : (p.descricao ?? "");
  const extra = p.pontuacao_sca ? ` · ${p.pontuacao_sca.toFixed(1)} pts` : "";
  return `• ${p.nome} (${p.marca}) — ${sobre}${extra} — ${brl(p.preco)}`;
}

export function responder(entrada: Entrada): Trace {
  const t0 = performance.now();
  const versao = versaoPorId(entrada.versao);
  const cap = versao.capacidades;
  const passos: Passo[] = [];
  const marcar = (p: Omit<Passo, "ms">, desde: number) => passos.push({ ...p, ms: Math.round((performance.now() - desde) * 100) / 100 });

  // A fala crua só é usada para entender e para as travas, em memória; o trace guarda a mascarada.
  const falaCrua = entrada.fala;
  let fala = entrada.fala;
  let ferramentasTexto = "";

  const fechar = (resposta: string, citados: Produto[], carrinho?: Trace["carrinho"]): Trace => {
    const tEntrada = estimarTokens(INSTRUCOES + fala + ferramentasTexto + (entrada.historico ?? []).map((m) => m.texto).join(" "));
    const tSaida = estimarTokens(resposta);
    return {
      id: novoId(),
      ts: new Date().toISOString(),
      versao: versao.id,
      modo: "demo",
      modelo: MODELO_REFERENCIA.id,
      fala,
      resposta,
      produtos: citados.map((p) => p.id),
      carrinho,
      passos,
      tokens: { entrada: tEntrada, saida: tSaida, estimado: true },
      custo_usd: custo(MODELO_REFERENCIA.id, tEntrada, tSaida),
      ms: Math.round((performance.now() - t0) * 100) / 100,
    };
  };

  // 0. Privacidade do registro: SEMPRE, em toda versão e antes de qualquer retorno.
  //    Não é uma "capacidade" da versão — nenhum caminho pode gravar dado pessoal cru.
  {
    const t = performance.now();
    const pii = mascararDadosPessoais(fala);
    if (pii.achados.length) {
      fala = pii.texto;
      marcar({ tipo: "trava", nome: "dados_pessoais", detalhe: `Mascarado antes de registrar: ${pii.achados.join(", ")}.`, status: "corrigiu" }, t);
    }
  }

  // 1. Travas de entrada
  let avisoSaude = false;
  if (cap.travas) {
    let t = performance.now();
    if (detectarInjecao(falaCrua)) {
      marcar({ tipo: "trava", nome: "injecao_de_prompt", detalhe: "Pedido para mudar regras ou revelar instruções. Resposta fixa, sem chamar ferramenta.", status: "bloqueou" }, t);
      return fechar(MSG_INJECAO, []);
    }
    marcar({ tipo: "trava", nome: "injecao_de_prompt", detalhe: "Nada suspeito.", status: "ok" }, t);
    t = performance.now();
    if (tocaEmSaude(falaCrua)) {
      avisoSaude = true;
      marcar({ tipo: "trava", nome: "saude", detalhe: "Tema de saúde: sem orientação médica, oferece descafeinado.", status: "alerta" }, t);
    }
  }

  // 2. Entender o pedido
  let t = performance.now();
  const pedido = entender(falaCrua, cap.apelidos);
  if (avisoSaude && (!pedido.categoria || pedido.categoria === "cafe")) {
    pedido.categoria = "cafe";
    pedido.descafeinado = true;
    pedido.entendido.push("descafeinado (saúde)");
  }
  if (pedido.quer_comecar && !pedido.categoria) {
    pedido.categoria = "kit";
    pedido.entendido.push("kit iniciante");
  }
  marcar({ tipo: "entrada", nome: "entender_pedido", detalhe: pedido.entendido.length ? pedido.entendido.join(" · ") : "Nada específico.", status: "ok", dados: pedido }, t);

  // 3. Faltou o essencial: pergunta, não chuta
  const vazio = !pedido.categoria && !pedido.metodo && !pedido.preco_max;
  if (vazio) {
    const r = "Pra eu acertar: como você costuma preparar o café (coador, prensa, expresso, italiana…) e você prefere algo mais suave ou mais encorpado?";
    marcar({ tipo: "saida", nome: "pergunta_de_esclarecimento", detalhe: "Sem método, categoria nem preço: perguntar antes de buscar.", status: "ok" }, performance.now());
    return fechar(avisoSaude ? `${AVISO_SAUDE}\n\n${r}` : r, []);
  }

  // 4. Buscar (e afrouxar se vier vazio)
  const filtros: FiltrosBusca = {
    categoria: pedido.categoria,
    tipo: pedido.tipo,
    metodo: pedido.metodo,
    torras: pedido.torras,
    notas: pedido.notas,
    preco_max: pedido.preco_max,
    descafeinado: pedido.descafeinado,
    termo: pedido.termo,
    limite: 3,
  };
  t = performance.now();
  let busca = buscarProdutos(filtros, { incluirEsgotados: !cap.travas });
  ferramentasTexto += JSON.stringify(busca.itens).slice(0, 4000);
  marcar({
    tipo: "ferramenta",
    nome: "buscar_produtos",
    detalhe: `${busca.total} encontrados${busca.esgotados_ignorados ? `, ${busca.esgotados_ignorados} esgotados fora` : ""}.`,
    status: "ok",
    dados: filtros,
  }, t);

  const afrouxados: string[] = [];
  if (busca.itens.length === 0 && cap.relaxar) {
    const ordem: [keyof FiltrosBusca, string][] = [["notas", "notas"], ["termo", "material"], ["torras", "torra"], ["preco_max", "preço"], ["tipo", "tipo"], ["metodo", "método"]];
    for (const [chave, rotulo] of ordem) {
      if (filtros[chave] === undefined) continue;
      t = performance.now();
      delete filtros[chave];
      afrouxados.push(rotulo);
      // Sem caber no orçamento, o que mais se aproxima é o mais barato — não o mais bem pontuado.
      busca = buscarProdutos(filtros, { incluirEsgotados: !cap.travas, ordem: afrouxados.includes("preço") ? "preco" : "relevancia" });
      marcar({ tipo: "ferramenta", nome: "buscar_produtos", detalhe: `Sem resultado: tirei ${rotulo}. ${busca.total} encontrados.`, status: "alerta", dados: { ...filtros } }, t);
      if (busca.itens.length) break;
    }
  }

  if (busca.itens.length === 0) {
    const r = "Não encontrei nada com essas características no catálogo agora. Quer que eu procure por outro método ou outra faixa de preço?";
    return fechar(avisoSaude ? `${AVISO_SAUDE}\n\n${r}` : r, []);
  }

  // 5. Compatibilidade e carrinho
  let principal = busca.itens[0];
  let extras: Produto[] = [];
  let avisoFiltro: string | undefined;
  const alternativos: Produto[] = [];
  if (cap.compatibilidade) {
    t = performance.now();
    // Cafeteira que pede filtro: prefere a que tem o filtro em estoque (não vende algo que não dá para usar).
    if (principal.specs?.filtro) {
      const usavel = busca.itens.find((p) => compativeis(p, pedido.metodo).length > 0);
      if (usavel && usavel !== principal) {
        busca.itens = [usavel, ...busca.itens.filter((p) => p !== usavel)];
        principal = usavel;
      }
    }
    extras = compativeis(principal, pedido.metodo);
    // Pediu algo que precisa de filtro e o filtro dele acabou: avisa e oferece a alternativa usável.
    if (principal.specs?.filtro && extras.length === 0) {
      const alt = buscarProdutos({ categoria: "equipamento", tipo: "cafeteira", metodo: pedido.metodo, limite: 10 }).itens.find(
        (p) => p.id !== principal.id && compativeis(p, pedido.metodo).length > 0,
      );
      avisoFiltro = `O filtro ${principal.specs.filtro} do ${principal.nome} está esgotado agora — sem ele não dá para usar.`;
      if (alt) {
        const f = compativeis(alt, pedido.metodo)[0];
        avisoFiltro += ` Se quiser já começar, o ${alt.nome} (${brl(alt.preco)}) usa o ${f.nome} (${brl(f.preco)}), que tem em estoque.`;
        alternativos.push(alt, f);
      }
    }
    marcar({
      tipo: "ferramenta",
      nome: "checar_compatibilidade",
      detalhe: extras.length
        ? `${principal.nome} pede: ${extras.map((e) => e.nome).join(", ")}.`
        : avisoFiltro
          ? `Filtro ${principal.specs?.filtro} esgotado: ofereceu alternativa.`
          : `${principal.nome} não precisa de complemento.`,
      status: avisoFiltro ? "alerta" : "ok",
    }, t);
  }
  let carrinho: Trace["carrinho"];
  if (pedido.quer_carrinho && cap.compatibilidade && !avisoFiltro) {
    t = performance.now();
    carrinho = montarCarrinho([principal.id, ...extras.map((e) => e.id)]);
    marcar({ tipo: "ferramenta", nome: "montar_carrinho", detalhe: `${carrinho.itens.length} itens · ${brl(carrinho.total)}.`, status: "ok", dados: carrinho }, t);
  }

  // 6. Resposta
  const citados = [...busca.itens, ...extras, ...alternativos.filter((a) => !busca.itens.includes(a))];
  const partes: string[] = [];
  if (avisoSaude) partes.push(AVISO_SAUDE);
  if (afrouxados.length) partes.push(`Com tudo que você pediu não achei nada, então tirei ${afrouxados.join(" e ")} da busca. Olha o que chega mais perto:`);
  else partes.push(pedido.metodo ? `Pra ${pedido.metodo}, separei estes:` : "Separei estes pra você:");
  partes.push(busca.itens.map(linhaProduto).join("\n"));
  if (extras.length) partes.push(`Pra usar o ${principal.nome}, você vai precisar de: ${extras.map((e) => `${e.nome} (${brl(e.preco)})`).join(", ")}.`);
  if (avisoFiltro) partes.push(avisoFiltro);
  if (carrinho) partes.push(`Montei o carrinho: ${carrinho.itens.length} itens, total de ${brl(carrinho.total)}.`);
  let resposta = partes.join("\n\n");

  // 7. Travas de saída
  if (cap.travas) {
    t = performance.now();
    const precos = conferirPrecos(resposta, citados, carrinho?.total);
    resposta = precos.corrigida;
    marcar({ tipo: "trava", nome: "preco_confere", detalhe: precos.ok ? "Todo preço citado é do catálogo." : `Corrigido: ${precos.errados.join(", ")}.`, status: precos.ok ? "ok" : "corrigiu" }, t);
    t = performance.now();
    const estoque = conferirEstoque(citados);
    marcar({ tipo: "trava", nome: "estoque", detalhe: estoque.ok ? "Nada esgotado na resposta." : `Esgotado citado: ${estoque.esgotados.map((p) => p.nome).join(", ")}.`, status: estoque.ok ? "ok" : "alerta" }, t);
  }
  marcar({ tipo: "saida", nome: "resposta", detalhe: `${citados.length} produtos citados.`, status: "ok" }, performance.now());
  return fechar(resposta, citados, carrinho);
}
