import { describe, expect, it } from "vitest";
import { combinaCom, filtrar, porSlug, produtos } from "@/lib/catalogo";

// Catálogo real gerado por data/gerar_catalogo.py (semente fixa). Sem mocks.

describe("filtrar", () => {
  it("método + categoria devolve só cafés que servem para o método", () => {
    const lista = filtrar({ categoria: "cafe", metodo: "V60" });
    expect(lista.length).toBeGreaterThan(0);
    expect(lista.every((p) => p.categoria === "cafe" && p.metodos?.includes("V60"))).toBe(true);
  });

  it("teto de preço é respeitado", () => {
    const lista = filtrar({ ate: "60" });
    expect(lista.length).toBeGreaterThan(0);
    expect(lista.every((p) => p.preco <= 60)).toBe(true);
  });

  it("busca por nota sensorial acha cafés com a nota", () => {
    const lista = filtrar({ q: "chocolate" });
    expect(lista.length).toBeGreaterThan(0);
    expect(lista.every((p) => JSON.stringify(p).toLowerCase().includes("chocolate"))).toBe(true);
  });

  it("filtros que não casam com nada devolvem lista vazia, sem erro", () => {
    expect(filtrar({ categoria: "filtro", torra: "Clara" })).toEqual([]);
  });
});

describe("combinaCom", () => {
  it("cafeteira V60 02 traz primeiro o filtro do mesmo tamanho, nunca o de outro", () => {
    const v60 = produtos.find((p) => p.nome === "Suporte V60 02 cerâmica")!;
    const lista = combinaCom(v60);
    const filtros = lista.filter((o) => o.categoria === "filtro");
    expect(filtros.length).toBeGreaterThan(0);
    expect(lista[0].categoria).toBe("filtro");
    expect(filtros.every((f) => f.compativel_com === "V60 02")).toBe(true);
  });

  it("café sugere só equipamento de algum método dele e com estoque", () => {
    const cafe = produtos.find((p) => p.categoria === "cafe" && p.metodos?.includes("Espresso"))!;
    const lista = combinaCom(cafe);
    expect(lista.length).toBeGreaterThan(0);
    for (const o of lista) {
      expect(o.estoque).toBeGreaterThan(0);
      expect(o.metodos?.some((m) => cafe.metodos!.includes(m))).toBe(true);
    }
  });
});

describe("porSlug", () => {
  it("acha pelo slug e devolve undefined para slug inexistente", () => {
    expect(porSlug(produtos[0].slug)?.id).toBe(produtos[0].id);
    expect(porSlug("nao-existe")).toBeUndefined();
  });
});
