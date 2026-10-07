import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { Simulador } from "@/components/Simulador";
import { MODELOS, MODELO_REFERENCIA } from "@/lib/agente/precos-modelos";
import { lerTraces, type TraceRegistrado } from "@/lib/agente/registro";
import { VERSOES, VERSAO_ATUAL } from "@/lib/agente/versoes";

export const metadata: Metadata = { title: "Custos e operação — Moenda" };

const media = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0);
const percentil = (xs: number[], p: number) => {
  if (!xs.length) return 0;
  const o = [...xs].sort((a, b) => a - b);
  return o[Math.min(o.length - 1, Math.floor((p / 100) * o.length))];
};
const semResultado = (t: TraceRegistrado) => t.produtos.length === 0 && /não encontrei/i.test(t.resposta);

export default function Custos() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-folha">observabilidade</p>
      <h1 className="mt-3 font-display text-5xl font-extrabold tracking-tight">Custo e operação</h1>
      <p className="mt-3 max-w-2xl text-lg text-tinta-2">
        Cada resposta da assistente vira um trace. Daqui sai quanto ela custa, quanto demora, quando trava algo e quando deixa o cliente
        sem resposta.
      </p>
      <Suspense fallback={<p className="mt-10 text-apagado">Lendo os traces…</p>}>
        <Painel />
      </Suspense>
    </div>
  );
}

async function Painel() {
  await connection();
  const todos = lerTraces();
  if (!todos.length) {
    return <p className="mt-10 text-apagado">Nenhum trace ainda. Rode <code className="font-mono">npm run eval</code> ou converse com a assistente.</p>;
  }
  const atuais = todos.filter((t) => t.versao === VERSAO_ATUAL.id);
  const entradaMedia = Math.round(media(atuais.map((t) => t.tokens.entrada)));
  const saidaMedia = Math.round(media(atuais.map((t) => t.tokens.saida)));
  const site = todos.filter((t) => t.origem === "site").length;

  const travas = new Map<string, number>();
  for (const t of atuais) for (const p of t.passos) if (p.tipo === "trava" && p.status !== "ok") travas.set(p.nome, (travas.get(p.nome) ?? 0) + 1);
  const travasOrdenadas = [...travas.entries()].sort((a, b) => b[1] - a[1]);
  const maxTrava = Math.max(1, ...travas.values());

  const porVersao = VERSOES.map((v) => {
    const ts = todos.filter((t) => t.versao === v.id);
    return {
      v,
      n: ts.length,
      custo: media(ts.map((t) => t.custo_usd)),
      ms: percentil(ts.map((t) => t.ms), 50),
      vazio: ts.length ? (ts.filter(semResultado).length / ts.length) * 100 : 0,
    };
  });

  return (
    <>
      <div className="mt-8 grid gap-3 sm:grid-cols-4">
        {[
          ["respostas registradas", todos.length.toLocaleString("pt-BR"), `${site} do site · ${todos.length - site} da eval`],
          ["custo médio por resposta", `US$ ${media(atuais.map((t) => t.custo_usd)).toFixed(5)}`, `estimado, preço do ${MODELO_REFERENCIA.nome}`],
          ["tokens por resposta", `${entradaMedia + saidaMedia}`, `${entradaMedia} entrada · ${saidaMedia} saída`],
          ["latência p95", `${percentil(atuais.map((t) => t.ms), 95).toFixed(1)} ms`, "modo demo, sem modelo"],
        ].map(([k, v, s]) => (
          <div key={k} className="rounded-2xl border border-linha bg-cartao p-5">
            <p className="text-xs uppercase tracking-wider text-apagado">{k}</p>
            <p className="mt-1 font-display text-3xl font-extrabold tabular-nums text-folha">{v}</p>
            <p className="mt-1 text-xs text-apagado">{s}</p>
          </div>
        ))}
      </div>

      <section className="mt-12 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <h2 className="font-display text-2xl font-bold">Simulador de troca de modelo</h2>
          <p className="mt-1 text-apagado">Quanto custaria a mesma assistente, no mesmo volume, em outro modelo.</p>
          <div className="mt-4">
            <Simulador modelos={MODELOS} entrada={entradaMedia} saida={saidaMedia} referencia={MODELO_REFERENCIA.id} />
          </div>
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold">Travas que agiram</h2>
          <p className="mt-1 text-apagado">Na versão {VERSAO_ATUAL.id}, o que foi bloqueado, corrigido ou sinalizado.</p>
          <ul className="mt-4 space-y-3 rounded-3xl border border-linha bg-cartao p-6">
            {travasOrdenadas.length === 0 && <li className="text-sm text-apagado">Nenhuma trava agiu ainda.</li>}
            {travasOrdenadas.map(([nome, n]) => (
              <li key={nome}>
                <div className="flex justify-between text-sm">
                  <span className="font-mono">{nome}</span>
                  <span className="font-mono tabular-nums">{n}</span>
                </div>
                <div className="mt-1.5 h-2.5 rounded-full bg-papel">
                  <div className="h-2.5 rounded-full bg-ouro" style={{ width: `${(n / maxTrava) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-bold">Por versão</h2>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-linha bg-cartao">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-linha text-left text-xs uppercase tracking-wider text-apagado">
                <th className="px-4 py-3 font-medium">Versão</th>
                <th className="px-4 py-3 text-right font-medium">Respostas</th>
                <th className="px-4 py-3 text-right font-medium">Custo médio</th>
                <th className="px-4 py-3 text-right font-medium">Latência p50</th>
                <th className="px-4 py-3 text-right font-medium">Cliente sem resposta</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {porVersao.map((r) => (
                <tr key={r.v.id} className="border-b border-linha last:border-0">
                  <td className="px-4 py-3">
                    <span className="font-mono text-folha">{r.v.id}</span> {r.v.nome}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">{r.n}</td>
                  <td className="px-4 py-3 text-right font-mono">US$ {r.custo.toFixed(5)}</td>
                  <td className="px-4 py-3 text-right font-mono">{r.ms.toFixed(2)} ms</td>
                  <td className={`px-4 py-3 text-right font-mono ${r.vazio > 10 ? "text-cereja" : ""}`}>{r.vazio.toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-apagado">
          “Cliente sem resposta” = respondeu “não encontrei” sem oferecer nada. A v0.3 zera isso afrouxando a busca e avisando o que tirou.
        </p>
      </section>
    </>
  );
}
