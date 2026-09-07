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
      "[ScanBarcodeUseCase] chamando repository.createOrIncrementByBarcode para barcode:",
      barcode,
      "quantity:",
      quantity,
    );

    try {
      const result = await this.productRepository.createOrIncrementByBarcode(
        barcode,
        () => ({
          title: `Produto sem nome (${barcode})`,
          description: DRAFT_PLACEHOLDER_DESCRIPTION,
          price: 0.01,
          imageUrl: DRAFT_PLACEHOLDER_IMAGE_URL,
          images: [DRAFT_PLACEHOLDER_IMAGE_URL],
          barcode,
          stock: 1,
          status: "DRAFT",
          isActive: true,
        }),
        quantity,
      );
      console.log("[ScanBarcodeUseCase] repository retornou:", result);
      return result;
    } catch (error) {
      console.error(
        "[ScanBarcodeUseCase] erro no repository.createOrIncrementByBarcode:",
        error,
      );
      throw error;
    }
  }
}
