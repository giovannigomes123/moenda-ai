import { mkdirSync, writeFileSync } from "node:fs";
import { avaliarIneditos, avaliarTodas, type ResultadoVersao } from "../src/lib/eval/avaliar";

// Roda a eval PT-BR em todas as versões do agente e grava src/data/eval.json (lido pela página /qualidade).
const resultados = avaliarTodas();
const ineditos = avaliarIneditos();
mkdirSync("src/data", { recursive: true });
writeFileSync("src/data/eval.json", JSON.stringify({ gerado_em: new Date().toISOString(), resultados, ineditos }, null, 2));

function mostrar(titulo: string, lista: ResultadoVersao[]) {
  console.log(`-- ${titulo} --`);
  for (const r of lista) {
    console.log(`${r.versao} ${r.nome.padEnd(20)} nota ${String(r.nota).padStart(5)}  aprovados ${r.aprovados}/${r.total}  graves ${r.graves}`);
  }
  const atual = lista[lista.length - 1];
  for (const c of atual.cenarios.filter((c) => c.nota < 1)) {
    const falhas = c.checagens.filter((k) => !k.passou).map((k) => k.nome).join("; ");
    console.log(`   ${c.id} ${c.nota.toFixed(2)} "${c.fala}" -> ${falhas}`);
  }
}

mostrar("conjunto de desenvolvimento", resultados);
mostrar("conjunto inédito", ineditos);
