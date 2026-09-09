import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryPromotionRepository } from "@/infrastructure/repositories/in-memory-promotion.repository";
import { ValidationError } from "@/shared/errors/domain-errors";
import { CreatePromotionUseCase } from "./create-promotion.use-case";

describe("CreatePromotionUseCase", () => {
  let promotionRepository: InMemoryPromotionRepository;
  let useCase: CreatePromotionUseCase;

  beforeEach(() => {
    promotionRepository = new InMemoryPromotionRepository([]);
    useCase = new CreatePromotionUseCase(promotionRepository);
  });

  it("cria uma promoção nova", async () => {
    const promotion = await useCase.execute({
      name: "Black Friday",
      discountPercentage: 20,
      active: true,
    });

    expect(promotion.id).toBeTruthy();
    expect(promotion.name).toBe("Black Friday");
    expect(promotion.discountPercentage).toBe(20);
  });

  it("lança ValidationError para nome duplicado (case-insensitive)", async () => {
    await useCase.execute({
      name: "Black Friday",
      discountPercentage: 20,
      active: true,
    });

    await expect(
      useCase.execute({
        name: "black friday",
        discountPercentage: 10,
        active: true,
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("lança ValidationError para percentual fora do intervalo 0-100", async () => {
    await expect(
      useCase.execute({ name: "Promo", discountPercentage: 150, active: true }),
    ).rejects.toThrow(ValidationError);

    await expect(
      useCase.execute({ name: "Promo", discountPercentage: -1, active: true }),
    ).rejects.toThrow(ValidationError);
  });

  it("lança ValidationError para nome muito curto", async () => {
    await expect(
      useCase.execute({ name: "A", discountPercentage: 10, active: true }),
    ).rejects.toThrow(ValidationError);
  });
});
