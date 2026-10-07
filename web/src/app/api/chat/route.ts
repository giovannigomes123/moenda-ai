import { responder } from "@/lib/agente/agente";
import { validarCorpo } from "@/lib/agente/entrada";
import { registrar } from "@/lib/agente/registro";

export async function POST(req: Request) {
  let corpo: unknown;
  try {
    corpo = await req.json();
  } catch {
    return Response.json({ erro: "Corpo inválido." }, { status: 400 });
  }
  const entrada = validarCorpo(corpo);
  if (!entrada.ok) return Response.json({ erro: entrada.erro }, { status: 400 });

  const trace = responder(entrada.valor);
  registrar(trace, "site");
  return Response.json(trace);
}
