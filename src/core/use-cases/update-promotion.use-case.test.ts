import { beforeEach, describe, expect, it } from "vitest";
import type { Promotion } from "@/core/schemas/promotion.schema";
import { InMemoryPromotionRepository } from "@/infrastructure/repositories/in-memory-promotion.repository";
import { NotFoundError, ValidationError } from "@/shared/errors/domain-errors";
import { UpdatePromotionUseCase } from "./update-promotion.use-case";

function buildPromotion(overrides: Partial<Promotion> = {}): Promotion {
  return {
    id: "promo-1",
    name: "Black Friday",
    discountPercentage: 20,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("UpdatePromotionUseCase", () => {
  let promotionRepository: InMemoryPromotionRepository;
  let useCase: UpdatePromotionUseCase;

  beforeEach(() => {
    promotionRepository = new InMemoryPromotionRepository([buildPromotion()]);
    useCase = new UpdatePromotionUseCase(promotionRepository);
  });

  it("lança NotFoundError se a promoção não existe", async () => {
    await expect(
      useCase.execute({ id: "inexistente", discountPercentage: 30 }),
    ).rejects.toThrow(NotFoundError);
  });

  it("atualiza o percentual de desconto", async () => {
    const updated = await useCase.execute({
      id: "promo-1",
      discountPercentage: 50,
    });

    expect(updated.discountPercentage).toBe(50);
  });

  it("renomear a promoção não exige sincronizar produtos (referência por id)", async () => {
    const updated = await useCase.execute({
      id: "promo-1",
      name: "Black Friday 2026",
    });

    expect(updated.name).toBe("Black Friday 2026");
  });

  it("lança ValidationError para nome duplicado de outra promoção", async () => {
    promotionRepository = new InMemoryPromotionRepository([
      buildPromotion({ id: "promo-1", name: "Black Friday" }),
      buildPromotion({ id: "promo-2", name: "Natal" }),
    ]);
    useCase = new UpdatePromotionUseCase(promotionRepository);

    await expect(
      useCase.execute({ id: "promo-2", name: "black friday" }),
    ).rejects.toThrow(ValidationError);
  });

  it("permite manter o mesmo nome (não conflita consigo mesma)", async () => {
    const updated = await useCase.execute({
      id: "promo-1",
      name: "Black Friday",
      discountPercentage: 25,
    });

    expect(updated.discountPercentage).toBe(25);
  });

  it("desativa a promoção", async () => {
    const updated = await useCase.execute({ id: "promo-1", active: false });
    expect(updated.active).toBe(false);
  });
});
