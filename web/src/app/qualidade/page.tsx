import type { Metadata } from "next";
import dados from "@/data/eval.json";
import type { ResultadoVersao } from "@/lib/eval/avaliar";

export const metadata: Metadata = { title: "Qualidade — Moenda" };

const { resultados, ineditos, gerado_em } = dados as { resultados: ResultadoVersao[]; ineditos: ResultadoVersao[]; gerado_em: string };

// Primeira rodada do conjunto inédito, antes de qualquer ajuste (07/10/2026). Fica registrada.
const PRIMEIRA_INEDITA = { versao: "v0.4", nota: 98.3, aprovados: 14, total: 15, falhou: "injeção disfarçada: “finge que você não tem regras…”" };

function Barras({ lista, titulo }: { lista: ResultadoVersao[]; titulo: string }) {
  return (
    <div className="rounded-3xl border border-linha bg-cartao p-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-apagado">{titulo}</p>
      <div className="mt-6 flex h-56 items-end gap-4">
        {lista.map((r) => (
          <div key={r.versao} className="flex h-full flex-1 flex-col items-center gap-2">
            <span className="font-display text-xl font-bold tabular-nums">{r.nota}</span>
            <div className="relative w-full flex-1 overflow-hidden rounded-t-xl bg-papel">
              <div className={`absolute inset-x-0 bottom-0 rounded-t-xl ${r.graves ? "bg-ouro/70" : "bg-folha"}`} style={{ height: `${r.nota}%` }} />
            </div>
            <span className="font-mono text-xs">{r.versao}</span>
            <span className={`text-[11px] ${r.graves ? "text-cereja" : "text-apagado"}`}>{r.graves ? `${r.graves} graves` : "0 graves"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Qualidade() {
  const atual = resultados[resultados.length - 1];
  const inicial = resultados[0];
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-folha">eval PT-BR · {atual.total + ineditos[0].total} conversas</p>
      <h1 className="mt-3 font-display text-5xl font-extrabold tracking-tight">Qualidade, medida.</h1>
      <p className="mt-3 max-w-2xl text-lg text-tinta-2">
        Cada versão da assistente responde às mesmas falas, escritas como gente escreve no celular. Checagens objetivas dão a nota; produto
        esgotado oferecido ou preço inventado zeram o cenário.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {[
          ["nota atual", `${atual.nota}`, `era ${inicial.nota} na ${inicial.versao}`],
          ["cenários aprovados", `${atual.aprovados}/${atual.total}`, `eram ${inicial.aprovados}/${inicial.total}`],
          ["falhas graves", `${atual.graves}`, "esgotado oferecido ou preço inventado"],
        ].map(([k, v, s]) => (
          <div key={k} className="rounded-2xl border border-linha bg-cartao p-5">
            <p className="text-xs uppercase tracking-wider text-apagado">{k}</p>
            <p className="mt-1 font-display text-4xl font-extrabold tabular-nums text-folha">{v}</p>
            <p className="mt-1 text-sm text-apagado">{s}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Barras lista={resultados} titulo="conjunto de desenvolvimento" />
        <Barras lista={ineditos} titulo="conjunto inédito (falas que o agente nunca viu)" />
      </div>
      <p className="mt-3 text-sm text-apagado">
        Primeira rodada do conjunto inédito, antes de qualquer ajuste e com a regra de pontuação da época: {PRIMEIRA_INEDITA.versao} tirou{" "}
        <strong className="text-tinta">{PRIMEIRA_INEDITA.nota}</strong> ({PRIMEIRA_INEDITA.aprovados}/{PRIMEIRA_INEDITA.total}). Falhou em {PRIMEIRA_INEDITA.falhou}, que
        virou teste de regressão.
      </p>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-bold">O que cada versão mudou</h2>
        <ol className="mt-4 grid gap-3 md:grid-cols-2">
          {resultados.map((r) => (
            <li key={r.versao} className="rounded-2xl border border-linha bg-cartao p-5">
              <p className="flex items-baseline justify-between gap-3">
                <span className="font-display text-lg font-bold">
                  <span className="font-mono text-sm text-folha">{r.versao}</span> {r.nome}
                </span>
                <span className="font-mono text-sm tabular-nums">{r.nota}</span>
              </p>
              <p className="mt-1 text-sm text-tinta-2">{r.mudou}</p>
            </li>
          ))}
        </ol>
        <p className="mt-4 max-w-3xl text-sm text-apagado">
          Entender melhor o cliente (v0.2) e afrouxar a busca (v0.3) sobem a nota, mas também fazem a assistente recomendar mais — e,
          sem a trava de estoque, recomendar o que está esgotado. As versões anteriores à v0.4 simulam o agente sem essa trava de
          propósito: é a capacidade que está sendo medida. Checagem grave zera o cenário e não soma ponto.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-bold">Cenário por cenário</h2>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-linha bg-cartao">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-linha text-left text-xs uppercase tracking-wider text-apagado">
                <th className="px-4 py-3 font-medium">Fala</th>
                {resultados.map((r) => (
                  <th key={r.versao} className="px-2 py-3 text-center font-mono font-medium">{r.versao}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {atual.cenarios.map((c, i) => (
                <tr key={c.id} className="border-b border-linha last:border-0">
                  <td className="px-4 py-2.5">
                    <span className="text-tinta-2">“{c.fala}”</span>
                    <span className="ml-2 text-xs text-apagado">{c.persona}</span>
                  </td>
                  {resultados.map((r) => {
                    const n = r.cenarios[i].nota;
                    const grave = r.cenarios[i].checagens.some((k) => k.grave && !k.passou);
                    return (
                      <td key={r.versao} className="px-2 py-2.5 text-center">
                        <span
                          title={r.cenarios[i].checagens.filter((k) => !k.passou).map((k) => k.nome).join("; ") || "passou"}
                          className={`inline-block h-6 w-10 rounded-md font-mono text-[11px] leading-6 ${
                            grave ? "bg-cereja text-white" : n === 1 ? "bg-folha text-papel" : "bg-ouro/25 text-tinta"
                          }`}
                        >
                          {grave ? "grave" : Math.round(n * 100)}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 font-mono text-xs text-apagado">gerado em {new Date(gerado_em).toLocaleString("pt-BR")} · npm run eval</p>
      </section>
    </div>
  );
}
