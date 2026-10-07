import Link from "next/link";

export function Cabecalho() {
  return (
    <header className="sticky top-0 z-20 border-b border-linha bg-papel/90 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center gap-6">
        <Link href="/" className="font-display text-2xl font-extrabold tracking-tight text-folha">
          moenda
        </Link>
        <nav className="hidden sm:flex gap-5 text-sm text-tinta-2">
          <Link href="/loja?categoria=cafe" className="hover:text-folha">Cafés</Link>
          <Link href="/loja?categoria=equipamento" className="hover:text-folha">Equipamentos</Link>
          <Link href="/loja?categoria=kit" className="hover:text-folha">Kits</Link>
          <Link href="/qualidade" className="hover:text-folha">Qualidade</Link>
          <Link href="/custos" className="hover:text-folha">Custos</Link>
        </nav>
        <form action="/loja" className="ml-auto flex-1 max-w-xs">
          <label className="sr-only" htmlFor="busca">Buscar</label>
          <input
            id="busca"
            name="q"
            placeholder="chocolate, V60, Etiópia…"
            className="w-full rounded-full border border-linha bg-cartao px-4 py-2 text-sm placeholder:text-apagado"
          />
        </form>
        <Link
          href="/assistente"
          className="hidden md:inline-flex items-center gap-2 rounded-full bg-folha px-3.5 py-2 text-xs font-semibold text-papel hover:opacity-90"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-papel" aria-hidden />
          Falar com a assistente
        </Link>
      </div>
    </header>
  );
}
