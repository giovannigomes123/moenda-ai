import Link from "next/link";
import { Embalagem } from "@/components/Embalagem";
import { brl, type Produto } from "@/lib/catalogo";

export function CartaoProduto({ p }: { p: Produto }) {
  const esgotado = p.estoque === 0;
  return (
    <Link
      href={`/produto/${p.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-linha bg-cartao transition hover:-translate-y-0.5 hover:border-folha"
    >
      <Embalagem p={p} className="aspect-[4/5]" />
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <div className="flex items-center justify-between gap-2 text-xs text-apagado">
          <span className="uppercase tracking-wider">{p.marca}</span>
          {p.pontuacao_sca && <span className="font-mono text-ouro">{p.pontuacao_sca.toFixed(1)} pts</span>}
        </div>
        <h3 className="font-display text-lg font-bold leading-tight group-hover:text-folha">{p.nome}</h3>
        {p.notas && <p className="text-sm text-tinta-2">{p.notas.join(" · ")}</p>}
        {!p.notas && p.metodos && p.metodos.length > 0 && (
          <p className="text-sm text-tinta-2">para {p.metodos.slice(0, 3).join(", ")}</p>
        )}
        <div className="mt-auto flex items-end justify-between pt-3">
          <span className="font-display text-xl font-bold">{brl(p.preco)}</span>
          {esgotado ? (
            <span className="rounded-full bg-cereja-suave px-2.5 py-1 text-xs font-semibold text-cereja">esgotado</span>
          ) : (
            p.peso_g && <span className="text-xs text-apagado">{p.peso_g} g · {p.forma?.toLowerCase()}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
