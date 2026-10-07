import { responder } from "../src/lib/agente/agente";
import { regravarEval } from "../src/lib/agente/registro";
import { VERSOES } from "../src/lib/agente/versoes";
import { CENARIOS, CENARIOS_INEDITOS } from "../src/lib/eval/cenarios";

// Roda todos os cenários em todas as versões e grava os traces (origem "eval") para a página /custos.
const traces = VERSOES.flatMap((v) => [...CENARIOS, ...CENARIOS_INEDITOS].map((c) => responder({ fala: c.fala, versao: v.id })));
regravarEval(traces);
console.log(`${traces.length} traces gravados em .dados/traces-eval.jsonl`);
