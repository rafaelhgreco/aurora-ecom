import { describe, expect, it } from "vitest";
import {
  buildFilterQuery,
  buildSizeOptions,
  filterProducts,
  parseFilterParams,
  sizeKey,
} from "./shop-filter-helpers";

const products = [
  { id: "1", category: "Camisetas", sizes: ["P", "M", "G"] },
  { id: "2", category: "Calças", sizes: ["m", "G"] },
  { id: "3", category: "Tênis", sizes: ["35", "36"] },
  { id: "4", category: "Kits", sizes: ["combo"] },
  { id: "5", category: "Sem tamanho" },
];

describe("buildSizeOptions", () => {
  it("une tamanhos que só diferem em caixa e conta produtos", () => {
    const options = buildSizeOptions(products);
    expect(options.find((o) => o.key === "m")).toEqual({
      key: "m",
      label: "M",
      count: 2,
    });
  });

  it("ordena numéricos, roupas e demais", () => {
    expect(buildSizeOptions(products).map((o) => o.label)).toEqual([
      "35",
      "36",
      "P",
      "M",
      "G",
      "combo",
    ]);
  });

  it("ignora produtos sem tamanhos e conta o produto uma vez", () => {
    expect(
      buildSizeOptions([{ sizes: ["M", "m", " M "] }, { sizes: undefined }]),
    ).toEqual([{ key: "m", label: "M", count: 1 }]);
  });
});

describe("filterProducts", () => {
  const none = new Set<string>();

  it("sem seleção devolve tudo", () => {
    expect(
      filterProducts(products, { categoryNames: none, sizeKeys: none }),
    ).toHaveLength(5);
  });

  it("tamanhos selecionados são OR", () => {
    const result = filterProducts(products, {
      categoryNames: none,
      sizeKeys: new Set(["35", "combo"]),
    });
    expect(result.map((p) => p.id)).toEqual(["3", "4"]);
  });

  it("casa independente da caixa cadastrada", () => {
    const result = filterProducts(products, {
      categoryNames: none,
      sizeKeys: new Set(["m"]),
    });
    expect(result.map((p) => p.id)).toEqual(["1", "2"]);
  });

  it("subcategoria e tamanho combinam com AND", () => {
    const result = filterProducts(products, {
      categoryNames: new Set(["Calças"]),
      sizeKeys: new Set(["g"]),
    });
    expect(result.map((p) => p.id)).toEqual(["2"]);
  });
});

describe("parseFilterParams / buildFilterQuery", () => {
  it("faz ida e volta, inclusive com vírgula no nome", () => {
    const state = {
      sectionIds: ["sec-1", "sec-2"],
      categoryNames: ["Calças, jeans", "Camisetas"],
      sizeKeys: ["m", "35"],
      page: 3,
      sortDirection: "desc" as const,
    };
    const query = buildFilterQuery(state);
    expect(parseFilterParams(new URLSearchParams(query))).toEqual(state);
  });

  it("omite grupos vazios e pagina=1", () => {
    expect(
      buildFilterQuery({
        sectionIds: [],
        categoryNames: [],
        sizeKeys: [],
        page: 1,
        sortDirection: "asc",
      }),
    ).toBe("");
  });

  it("normaliza tamanho e descarta página inválida", () => {
    const parsed = parseFilterParams(
      new URLSearchParams("tam=M&tam=m&pagina=abc"),
    );
    expect(parsed.sizeKeys).toEqual(["m"]);
    expect(parsed.page).toBe(1);
    expect(parsed.sortDirection).toBe("asc");
  });
});

describe("sizeKey", () => {
  it("remove espaços e ignora caixa", () => {
    expect(sizeKey(" GG ")).toBe("gg");
  });
});
