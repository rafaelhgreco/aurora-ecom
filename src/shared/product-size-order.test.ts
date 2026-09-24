import { describe, expect, it } from "vitest";
import { sortSizeOptions, sortSizes } from "./product-size-order";

describe("sortSizeOptions", () => {
  it("agrupa numéricos → roupas → volumes → demais", () => {
    expect(
      sortSizeOptions([
        "36",
        "35",
        "M",
        "G",
        "GG",
        "combo",
        "500ml",
        "100ml",
        "37,5",
        "P",
      ]),
    ).toEqual([
      "35",
      "36",
      "37,5",
      "P",
      "M",
      "G",
      "GG",
      "100ml",
      "500ml",
      "combo",
    ]);
  });

  it("ordena numéricos por valor, não por texto", () => {
    expect(sortSizeOptions(["100", "35", "9"])).toEqual(["9", "35", "100"]);
  });

  it("ordena os demais alfabeticamente", () => {
    expect(sortSizeOptions(["Único", "Combo"])).toEqual(["Combo", "Único"]);
  });

  it("não muta o array recebido", () => {
    const input = ["M", "35"];
    sortSizeOptions(input);
    expect(input).toEqual(["M", "35"]);
  });
});

describe("sortSizes", () => {
  it("continua ordenando um único produto pelo conjunto inteiro", () => {
    expect(sortSizes(["G", "P", "M"])).toEqual(["P", "M", "G"]);
    expect(sortSizes(["36", "35"])).toEqual(["35", "36"]);
  });
});
