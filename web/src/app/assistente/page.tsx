import type { Metadata } from "next";
import { Chat } from "@/components/Chat";

export const metadata: Metadata = { title: "Assistente — Moenda" };

export default function Assistente() {
  return <Chat />;
}
