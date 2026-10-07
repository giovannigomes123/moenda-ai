import Link from "next/link";
import { CartaoProduto } from "@/components/CartaoProduto";
import { Embalagem } from "@/components/Embalagem";
import { METODOS, produtos } from "@/lib/catalogo";

export default function Home() {
  const cafes = produtos.filter((p) => p.categoria === "cafe" && p.estoque > 0);
  const destaques = [...cafes].sort((a, b) => (b.pontuacao_sca ?? 0) - (a.pontuacao_sca ?? 0)).slice(0, 8);
  const vitrine = destaques.slice(0, 3);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <section className="grid gap-10 py-14 md:grid-cols-[1.1fr_1fr] md:items-center">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-folha">café especial · {cafes.length} lotes em estoque</p>
          <h1 className="mt-4 font-display text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-6xl">
            Do grão à xícara,
            <br />
            <span className="text-folha">com uma IA que mostra como pensa.</span>
          </h1>
          <p className="mt-5 max-w-lg text-lg text-tinta-2">
            Diga como você prepara e do que gosta. A assistente da Moenda recomenda o café, o moedor e o filtro certos — e
            mostra cada decisão que tomou no caminho.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/loja?categoria=cafe" className="rounded-full bg-cereja px-6 py-3 font-semibold text-white hover:opacity-90">
              Ver os cafés
            </Link>
            <Link href="/loja" className="rounded-full border border-linha bg-cartao px-6 py-3 font-semibold hover:border-folha">
              Catálogo completo
            </Link>
          </div>
        </div>
        <div className="relative grid grid-cols-3 items-end gap-3">
          {vitrine.map((p, i) => (
            <Link
              key={p.id}
              href={`/produto/${p.slug}`}
              className={`overflow-hidden rounded-2xl border border-linha ${i === 1 ? "-translate-y-6" : ""}`}
            >
              <Embalagem p={p} className="aspect-[3/4]" />
            </Link>
          ))}
        </div>
      </section>

      <section className="border-t border-linha py-10">
        <h2 className="font-display text-2xl font-bold">Escolha pelo seu método</h2>
        <p className="mt-1 text-apagado">Cada café e cada equipamento sabe com quais métodos combina.</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {METODOS.map((m) => (
            <Link
              key={m}
              href={`/loja?metodo=${encodeURIComponent(m)}`}
              className="rounded-full border border-linha bg-cartao px-4 py-2 text-sm font-medium hover:border-folha hover:text-folha"
            >
              {m}
            </Link>
          ))}
        </div>
      </section>

      <section className="py-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold">Os mais bem pontuados</h2>
            <p className="mt-1 text-apagado">Pontuação SCA da torrefação, do maior para o menor.</p>
          </div>
          <Link href="/loja?categoria=cafe" className="text-sm font-semibold text-folha hover:underline">ver todos →</Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {destaques.map((p) => (
            <CartaoProduto key={p.id} p={p} />
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-8 rounded-3xl bg-folha p-8 text-papel md:grid-cols-2 md:p-12">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] opacity-80">bastidores da IA</p>
          <h2 className="mt-3 font-display text-3xl font-bold">Nada de caixa-preta.</h2>
          <p className="mt-3 opacity-90">
            Ao lado do chat, um painel mostra o que a assistente fez em cada resposta: o que entendeu, as ferramentas que chamou, as
            travas que dispararam e quanto custou. E cada versão é medida numa bateria de conversas em português de verdade.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/assistente" className="rounded-full bg-papel px-5 py-2.5 font-semibold text-folha hover:opacity-90">Abrir a assistente</Link>
            <Link href="/qualidade" className="rounded-full border border-papel/40 px-5 py-2.5 font-semibold hover:border-papel">Ver a qualidade medida</Link>
          </div>
        </div>
        <div className="rounded-2xl bg-papel/10 p-5 font-mono text-sm leading-relaxed">
          <p className="opacity-70">“café forte pra prensa até 100 conto”</p>
          <p className="mt-3">● entendeu: método=Prensa francesa · torra=Média-escura|Escura · preço≤100</p>
          <p>● buscar_produtos: 6 encontrados, 2 esgotados fora</p>
          <p>● trava preco_confere: todo preço citado é do catálogo</p>
          <p>● trava estoque: nada esgotado na resposta</p>
        </div>
      </section>
    </div>
  );
}
