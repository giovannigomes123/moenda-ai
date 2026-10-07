export type TipoPasso = "entrada" | "trava" | "ferramenta" | "modelo" | "saida";
export type StatusPasso = "ok" | "bloqueou" | "corrigiu" | "alerta";

/** Um passo do raciocínio do agente, como aparece no painel "Bastidores". */
export type Passo = {
  tipo: TipoPasso;
  nome: string;
  detalhe: string;
  status: StatusPasso;
  dados?: unknown;
  ms: number;
};

export type Mensagem = { papel: "cliente" | "assistente"; texto: string };

export type ItemCarrinho = { id: string; nome: string; preco: number; quantidade: number };

export type Trace = {
  id: string;
  ts: string;
  versao: string;
  modo: "demo" | "llm";
  modelo: string;
  fala: string;
  resposta: string;
  produtos: string[];
  carrinho?: { itens: ItemCarrinho[]; total: number };
  passos: Passo[];
  tokens: { entrada: number; saida: number; estimado: boolean };
  custo_usd: number;
  ms: number;
};

/** O que cada versão do agente sabe fazer. A eval roda todas para medir a evolução. */
export type Capacidades = {
  apelidos: boolean; // entende "expresso", "coador", "forte", "sem acidez", "até 80 conto"
  relaxar: boolean; // se a busca volta vazia, afrouxa filtros em ordem e avisa
  compatibilidade: boolean; // sugere filtro e equipamento compatíveis, monta carrinho coerente
  travas: boolean; // injeção, dados pessoais, saúde, preço/produto inventado, esgotado
};
