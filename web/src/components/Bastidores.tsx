"use client";

import { useState } from "react";
import type { Passo, Trace } from "@/lib/agente/tipos";

const COR_STATUS: Record<Passo["status"], string> = {
  ok: "bg-folha",
  alerta: "bg-ouro",
  corrigiu: "bg-ouro",
  bloqueou: "bg-cereja",
};
const ROTULO_TIPO: Record<Passo["tipo"], string> = {
  entrada: "entendeu",
  trava: "trava",
  ferramenta: "ferramenta",
  modelo: "modelo",
  saida: "saída",
};

export function Bastidores({ trace }: { trace?: Trace }) {
  const [json, setJson] = useState(false);
  if (!trace) {
    return (
      <div className="flex h-full flex-col justify-center gap-3 p-6 text-sm text-apagado">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-folha">bastidores</p>
        <p>Mande uma mensagem e veja aqui, passo a passo, o que a assistente fez: o que entendeu, as ferramentas que chamou, as travas que dispararam e quanto custou.</p>
      </div>
    );
  }
  const travas = trace.passos.filter((p) => p.tipo === "trava" && p.status !== "ok").length;
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-linha p-5">
        <div className="flex items-center justify-between">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-folha">bastidores</p>
          <span className="rounded-full bg-folha-suave px-2.5 py-0.5 font-mono text-xs text-folha">
            {trace.versao} · {trace.modo === "demo" ? "modo demo" : trace.modelo}
          </span>
        </div>
        <dl className="mt-4 grid grid-cols-4 gap-2 text-center">
          {[
            ["tempo", `${trace.ms < 1000 ? trace.ms.toFixed(1) + " ms" : (trace.ms / 1000).toFixed(1) + " s"}`],
            ["tokens", `${trace.tokens.entrada + trace.tokens.saida}${trace.tokens.estimado ? "*" : ""}`],
            ["custo", `US$ ${trace.custo_usd.toFixed(5)}`],
            ["travas", String(travas)],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl bg-papel px-1 py-2">
              <dt className="text-[10px] uppercase tracking-wider text-apagado">{k}</dt>
              <dd className="mt-0.5 font-mono text-sm font-semibold tabular-nums">{v}</dd>
            </div>
          ))}
        </dl>
        {trace.tokens.estimado && <p className="mt-2 text-[11px] text-apagado">* tokens e custo estimados (modo demo, sem modelo), pelo preço do {trace.modelo}.</p>}
      </div>

      <ol className="flex-1 space-y-0 overflow-y-auto p-5">
        {trace.passos.map((p, i) => (
          <li key={i} className="relative flex gap-3 pb-5 last:pb-0">
            {i < trace.passos.length - 1 && <span className="absolute left-[5px] top-4 h-full w-px bg-linha" />}
            <span className={`relative mt-1.5 h-[11px] w-[11px] shrink-0 rounded-full ${COR_STATUS[p.status]}`} />
            <div className="min-w-0">
              <p className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-[10px] uppercase tracking-wider text-apagado">{ROTULO_TIPO[p.tipo]}</span>
                <span className="font-mono text-sm font-semibold">{p.nome}</span>
                {p.status !== "ok" && <span className="text-[11px] font-semibold uppercase text-cereja">{p.status}</span>}
              </p>
              <p className="mt-0.5 text-sm text-tinta-2">{p.detalhe}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="border-t border-linha p-4">
        <button type="button" onClick={() => setJson((v) => !v)} className="font-mono text-xs text-folha hover:underline">
          {json ? "esconder" : "ver"} trace em JSON
        </button>
        {json && (
          <pre className="mt-3 max-h-64 overflow-auto rounded-xl bg-papel p-3 font-mono text-[11px] leading-relaxed text-tinta-2">
            {JSON.stringify(trace, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
