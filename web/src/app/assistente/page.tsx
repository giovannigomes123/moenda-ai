import type { Metadata } from "next";
import { Chat } from "@/components/Chat";
import { modeloLLM, modoLLMLigado } from "@/lib/agente/llm";

export const metadata: Metadata = { title: "Assistente — Moenda" };

export default function Assistente() {
  return <Chat modelo={modoLLMLigado() ? modeloLLM() : undefined} />;
}
