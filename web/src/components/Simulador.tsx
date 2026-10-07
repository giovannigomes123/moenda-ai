"use client";

import { useState } from "react";
import type { PrecoModelo } from "@/lib/agente/precos-modelos";

type Props = { modelos: PrecoModelo[]; entrada: number; saida: number; referencia: string };

const usd = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "USD", maximumFractionDigits: v < 10 ? 2 : 0 });

export function Simulador({ modelos, entrada, saida, referencia }: Props) {
  const [conversas, setConversas] = useState(10_000);
  const [turnos, setTurnos] = useState(4);
  const respostas = conversas * turnos;
  const linhas = modelos
    .map((m) => ({ ...m, mes: (respostas * (entrada * m.entrada + saida * m.saida)) / 1_000_000 }))
    .sort((a, b) => a.mes - b.mes);
  const ref = linhas.find((l) => l.id === referencia)!;
  const maior = Math.max(...linhas.map((l) => l.mes));

  return (
    <div className="rounded-3xl border border-linha bg-cartao p-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="flex justify-between text-sm">
            <span className="text-apagado">Conversas por mês</span>
            <span className="font-mono font-semibold tabular-nums">{conversas.toLocaleString("pt-BR")}</span>
          </span>
          <input type="range" min={1000} max={200000} step={1000} value={conversas} onChange={(e) => setConversas(Number(e.target.value))} className="mt-2 w-full accent-[var(--folha)]" />
        </label>
        <label className="block">
          <span className="flex justify-between text-sm">
            <span className="text-apagado">Respostas por conversa</span>
            <span className="font-mono font-semibold tabular-nums">{turnos}</span>
          </span>
          <input type="range" min={1} max={12} value={turnos} onChange={(e) => setTurnos(Number(e.target.value))} className="mt-2 w-full accent-[var(--folha)]" />
        </label>
      </div>

      <ul className="mt-6 space-y-3">
        {linhas.map((l) => {
          const delta = ((l.mes - ref.mes) / ref.mes) * 100;
          return (
            <li key={l.id}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="font-medium">
                  {l.nome}
                  {l.id === referencia && <span className="ml-2 rounded-full bg-folha-suave px-2 py-0.5 text-[11px] text-folha">atual</span>}
                </span>
                <span className="font-mono tabular-nums">
                  {usd(l.mes)}/mês
                  {l.id !== referencia && (
                    <span className={`ml-2 text-xs ${delta > 0 ? "text-cereja" : "text-folha"}`}>
                      {delta > 0 ? "+" : ""}
                      {delta.toFixed(0)}%
                    </span>
                  )}
                </span>
              </div>
              <div className="mt-1.5 h-2.5 rounded-full bg-papel">
                <div className={`h-2.5 rounded-full ${l.id === referencia ? "bg-folha" : "bg-tinta-2/40"}`} style={{ width: `${Math.max(2, (l.mes / maior) * 100)}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-5 text-xs text-apagado">
        Base: {entrada} tokens de entrada e {saida} de saída por resposta (média medida nos traces da versão atual). Preço por milhão de tokens
        nas fontes de cada modelo — confira antes de decidir. Custo só não basta: troque o modelo e rode a eval antes.
      </p>
    </div>
  );
}
