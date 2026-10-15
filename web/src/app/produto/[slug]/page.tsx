import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CartaoProduto } from "@/components/CartaoProduto";
import { Embalagem } from "@/components/Embalagem";
import { brl, CATEGORIAS, combinaCom, porSlug, produtos } from "@/lib/catalogo";

export function generateStaticParams() {
  return produtos.map((p) => ({ slug: p.slug }));
}

function Barra({ rotulo, valor }: { rotulo: string; valor: number }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-16 text-apagado">{rotulo}</span>
      <div className="flex gap-1" aria-label={`${rotulo} ${valor} de 5`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className={`h-2.5 w-7 rounded-full ${i <= valor ? "bg-folha" : "bg-linha"}`} />
        ))}
      </div>
    </div>
  );
}

export default function PaginaProduto(props: PageProps<"/produto/[slug]">) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 text-apagado">Carregando o produto…</div>}>
      <Detalhe params={props.params} />
    </Suspense>
  );
}

async function Detalhe({ params }: { params: PageProps<"/produto/[slug]">["params"] }) {
  const { slug } = await params;
  const p = porSlug(slug);
  if (!p) notFound();

  const ficha: [string, string | undefined][] =
    p.categoria === "cafe"
      ? [
          ["Origem", p.origem],
          ["Altitude", p.altitude_m ? `${p.altitude_m} m` : undefined],
          ["Variedade", p.variedade],
          ["Processo", p.processo],
          ["Torra", p.torra],
          ["Forma", p.forma],
          ["Peso", p.peso_g ? `${p.peso_g} g` : undefined],
        ]
      : [
          ["Tipo", p.tipo ?? p.categoria],
          ["Serve no filtro", p.compativel_com],
          ...Object.entries(p.specs ?? {}).map(([k, v]) => [k.replaceAll("_", " "), String(v === true ? "sim" : v === false ? "não" : v)] as [string, string]),
          ["Inclui", p.itens?.join(", ")],
          ["Como funciona", p.descricao],
        ];
  const combina = combinaCom(p);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <nav className="text-sm text-apagado">
        <Link href="/loja" className="hover:text-folha">Loja</Link> /{" "}
        <Link href={`/loja?categoria=${p.categoria}`} className="hover:text-folha">{CATEGORIAS.find((c) => c.id === p.categoria)?.nome ?? p.categoria}</Link>
      </nav>

      <div className="mt-6 grid gap-10 md:grid-cols-2">
        <Embalagem p={p} className="aspect-square rounded-3xl border border-linha" />
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-apagado">{p.marca}</p>
          <h1 className="mt-2 font-display text-5xl font-extrabold tracking-tight">{p.nome}</h1>
          {p.pontuacao_sca && (
            <p className="mt-2 font-mono text-sm text-ouro">{p.pontuacao_sca.toFixed(1)} pontos SCA{p.descafeinado ? " · descafeinado" : ""}</p>
          )}
          {p.notas && <p className="mt-4 text-xl text-tinta-2">Notas de {p.notas.join(", ")}.</p>}

          <div className="mt-6 flex items-center gap-4">
            <span className="font-display text-4xl font-bold">{brl(p.preco)}</span>
            {p.frequencia && <span className="text-apagado">/ mês</span>}
          </div>
          <button
            type="button"
            disabled={p.estoque === 0}
            className="mt-5 w-full rounded-full bg-cereja px-6 py-3.5 font-semibold text-white enabled:hover:opacity-90 disabled:cursor-not-allowed disabled:bg-linha disabled:text-apagado sm:w-auto"
          >
            {p.estoque === 0 ? "Esgotado" : "Adicionar ao carrinho"}
          </button>
          {p.estoque > 0 && p.estoque < 5 && <p className="mt-2 text-sm text-cereja">Últimas {p.estoque} unidades.</p>}

          {p.perfil && (
            <div className="mt-8 space-y-2.5">
              <Barra rotulo="Acidez" valor={p.perfil.acidez} />
              <Barra rotulo="Corpo" valor={p.perfil.corpo} />
              <Barra rotulo="Doçura" valor={p.perfil.docura} />
            </div>
          )}

          {p.metodos && p.metodos.length > 0 && (
            <div className="mt-8">
              <p className="text-xs font-semibold uppercase tracking-wider text-apagado">Bom para</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {p.metodos.map((m) => (
                  <Link key={m} href={`/loja?metodo=${encodeURIComponent(m)}`} className="rounded-full bg-folha-suave px-3 py-1 text-sm text-folha hover:underline">
                    {m}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <dl className="mt-8 divide-y divide-linha border-y border-linha text-sm">
            {ficha
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 py-2.5">
                  <dt className="capitalize text-apagado">{k}</dt>
                  <dd className="text-right font-medium">{v}</dd>
                </div>
              ))}
          </dl>
        </div>
      </div>

      {combina.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-2xl font-bold">Combina com</h2>
          <p className="mt-1 text-apagado">Escolhido pelos métodos e pelo tamanho de filtro — a mesma regra que a IA vai usar.</p>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {combina.map((o) => (
              <CartaoProduto key={o.id} p={o} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
