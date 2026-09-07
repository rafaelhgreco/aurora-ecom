import type { IProductRepository } from "@/core/repositories/product.repository.interface";
import {
  DRAFT_PLACEHOLDER_DESCRIPTION,
  DRAFT_PLACEHOLDER_IMAGE_URL,
  type Product,
  type ScanBarcodeInput,
  scanBarcodeSchema,
} from "@/core/schemas/product.schema";
import { ValidationError } from "@/shared/errors/domain-errors";

export type ScanBarcodeResult = { product: Product; created: boolean };

export class ScanBarcodeUseCase {
  constructor(private readonly productRepository: IProductRepository) {}

  async execute(input: ScanBarcodeInput): Promise<ScanBarcodeResult> {
    console.log("[ScanBarcodeUseCase] execute chamado com input:", input);
    let validated: { barcode: string; quantity: number };

    try {
      validated = scanBarcodeSchema.parse(input);
      console.log("[ScanBarcodeUseCase] validação OK:", validated);
    } catch (error) {
      console.error("[ScanBarcodeUseCase] erro de validação:", error);
      if (error instanceof Error) {
        throw new ValidationError(error.message, [
          { field: "barcode", message: error.message },
        ]);
      }
      throw error;
    }

    const { barcode, quantity } = validated;

    console.log(
      "[ScanBarcodeUseCase] verificando se barcode já existe:",
      barcode,
    );

    try {
      const existing = await this.productRepository.findByBarcode(barcode);

      if (existing) {
        console.log(
          "[ScanBarcodeUseCase] já existe, incrementando stock em",
          quantity,
        );
        const updated = await this.productRepository.incrementStockByBarcode(
          barcode,
          quantity,
        );
        return { product: updated, created: false };
      }

      console.log("[ScanBarcodeUseCase] não existe, criando DRAFT");
      const created = await this.productRepository.createDraftByBarcode(
        barcode,
        () => ({
          title: `Produto sem nome (${barcode})`,
          description: DRAFT_PLACEHOLDER_DESCRIPTION,
          price: 0.01,
          imageUrl: DRAFT_PLACEHOLDER_IMAGE_URL,
          images: [DRAFT_PLACEHOLDER_IMAGE_URL],
          barcode,
          stock: quantity,
          status: "DRAFT",
          isActive: true,
        }),
      );
      return { product: created, created: true };
    } catch (error) {
      console.error("[ScanBarcodeUseCase] erro no repository:", error);
      throw error;
    }
  }
}
