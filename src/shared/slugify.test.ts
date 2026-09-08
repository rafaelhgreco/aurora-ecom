import { describe, expect, it } from "vitest";
import { isValidSlugFormat, slugify } from "./slugify";

describe("slugify", () => {
  it("remove acentos e converte para minúsculas", () => {
    expect(slugify("Camiseta Básica Branca")).toBe("camiseta-basica-branca");
    expect(slugify("Vestido Rosé Elegância")).toBe("vestido-rose-elegancia");
  });

  it("substitui espaços e caracteres especiais por hífen único", () => {
    expect(slugify("Blusa  100%  Algodão!!")).toBe("blusa-100-algodao");
  });

  it("remove hífens nas bordas", () => {
    expect(slugify("  -Produto Teste- ")).toBe("produto-teste");
  });

  it("trunca em 150 caracteres sem deixar hífen sobrando no final", () => {
    const longTitle = "a".repeat(200);
    const result = slugify(longTitle);
    expect(result.length).toBeLessThanOrEqual(150);
    expect(result.endsWith("-")).toBe(false);
  });

  it("retorna string vazia para entrada sem caracteres válidos", () => {
    expect(slugify("!!!")).toBe("");
    expect(slugify("")).toBe("");
  });
});

describe("isValidSlugFormat", () => {
  it("aceita slugs válidos", () => {
    expect(isValidSlugFormat("camiseta-basica-branca")).toBe(true);
    expect(isValidSlugFormat("produto-1")).toBe(true);
    expect(isValidSlugFormat("a")).toBe(true);
  });

  it("rejeita maiúsculas, espaços, acentos e hífens nas bordas ou duplicados", () => {
    expect(isValidSlugFormat("Camiseta-Basica")).toBe(false);
    expect(isValidSlugFormat("camiseta basica")).toBe(false);
    expect(isValidSlugFormat("camiseta-básica")).toBe(false);
    expect(isValidSlugFormat("-camiseta")).toBe(false);
    expect(isValidSlugFormat("camiseta-")).toBe(false);
    expect(isValidSlugFormat("camiseta--basica")).toBe(false);
  });

  it("rejeita string vazia e acima de 150 caracteres", () => {
    expect(isValidSlugFormat("")).toBe(false);
    expect(isValidSlugFormat("a".repeat(151))).toBe(false);
  });
});
