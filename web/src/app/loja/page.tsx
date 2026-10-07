import Link from "next/link";
import { Suspense } from "react";
import { CartaoProduto } from "@/components/CartaoProduto";
import { CATEGORIAS, METODOS, TORRAS, filtrar, type Filtros } from "@/lib/catalogo";

function uma(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

function link(atual: Filtros, mudanca: Partial<Filtros>) {
  const f = { ...atual, ...mudanca };
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(f)) if (v) qs.set(k, v);
  const s = qs.toString();
  return s ? `/loja?${s}` : "/loja";
}

function Chip({ ativo, href, children }: { ativo: boolean; href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={ativo ? "true" : undefined}
      className={`rounded-full border px-3 py-1.5 text-sm transition ${
        ativo ? "border-folha bg-folha text-papel" : "border-linha bg-cartao hover:border-folha"
      }`}
    >
      {children}
    </Link>
  );
}

export default function Loja(props: PageProps<"/loja">) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 text-apagado">Carregando o catálogo…</div>}>
      <Catalogo searchParams={props.searchParams} />
    </Suspense>
  );
}

async function Catalogo({ searchParams }: { searchParams: PageProps<"/loja">["searchParams"] }) {
  const sp = await searchParams;
  const f: Filtros = {
    categoria: uma(sp.categoria),
    metodo: uma(sp.metodo),
    torra: uma(sp.torra),
    ate: uma(sp.ate),
    q: uma(sp.q),
  };
  const lista = filtrar(f);
  const titulo = CATEGORIAS.find((c) => c.id === f.categoria)?.nome ?? (f.q ? `Busca: “${f.q}”` : "Catálogo");

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <h1 className="font-display text-4xl font-extrabold tracking-tight">{titulo}</h1>
      <p className="mt-1 text-apagado">
        {lista.length} {lista.length === 1 ? "produto" : "produtos"}
      </p>

      <div className="mt-6 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-20 text-xs font-semibold uppercase tracking-wider text-apagado">Tipo</span>
          <Chip ativo={!f.categoria} href={link(f, { categoria: undefined })}>Tudo</Chip>
          {CATEGORIAS.map((c) => (
            <Chip key={c.id} ativo={f.categoria === c.id} href={link(f, { categoria: c.id })}>{c.nome}</Chip>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-20 text-xs font-semibold uppercase tracking-wider text-apagado">Método</span>
          {METODOS.map((m) => (
            <Chip key={m} ativo={f.metodo === m} href={link(f, { metodo: f.metodo === m ? undefined : m })}>{m}</Chip>
          ))}
        </div>
        {(!f.categoria || f.categoria === "cafe") && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-20 text-xs font-semibold uppercase tracking-wider text-apagado">Torra</span>
            {TORRAS.map((t) => (
              <Chip key={t} ativo={f.torra === t} href={link(f, { torra: f.torra === t ? undefined : t })}>{t}</Chip>
            ))}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-20 text-xs font-semibold uppercase tracking-wider text-apagado">Até</span>
          {["60", "100", "300", "1000"].map((v) => (
            <Chip key={v} ativo={f.ate === v} href={link(f, { ate: f.ate === v ? undefined : v })}>R$ {v}</Chip>
          ))}
        </div>
      </div>

      {lista.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-linha p-10 text-center">
          <p className="font-display text-xl font-bold">Nada com esses filtros.</p>
          <p className="mt-1 text-apagado">Tire um filtro ou <Link href="/loja" className="text-folha underline">veja o catálogo inteiro</Link>.</p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {lista.map((p) => (
            <CartaoProduto key={p.id} p={p} />
          ))}
        </div>
      )}
    </div>
  );
}
