import type { Metadata } from "next";
import { Bricolage_Grotesque, Figtree, JetBrains_Mono } from "next/font/google";
import { Cabecalho } from "@/components/Cabecalho";
import "./globals.css";

const bricolage = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"] });
const figtree = Figtree({ variable: "--font-figtree", subsets: ["latin"] });
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Moenda — café especial",
  description: "Cafés especiais, equipamentos e uma IA que mostra como pensa.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${bricolage.variable} ${figtree.variable} ${jetbrains.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <Cabecalho />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-linha mt-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 text-sm text-apagado flex flex-col sm:flex-row gap-2 justify-between">
            <span>Moenda é uma loja fictícia, feita para demonstrar um agente de IA de e-commerce.</span>
            <span className="font-mono text-xs">catálogo gerado · nenhum dado real</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
