"use server";

import { requireAdminSession } from "@/app/services/require-admin-session";
import type { BulkImportPreviewProduct } from "@/core/import/validate-bulk-import";
import { validateBulkImportRows } from "@/core/import/validate-bulk-import";
import type { BulkImportRowError } from "@/core/schemas/bulk-import.schema";
import type { CreateProductInput } from "@/core/schemas/product.schema";
import { BulkImportProductsUseCase } from "@/core/use-cases/bulk-import-products.use-case";
import { generateBulkImportTemplateBuffer } from "@/infrastructure/import/generate-template-xlsx";
import { parseXlsxBuffer } from "@/infrastructure/import/parse-xlsx-buffer";
import { saveImportJob } from "@/infrastructure/repositories/firestore-import-job.repository";
import { FirestoreProductRepository } from "@/infrastructure/repositories/firestore-product.repository";
import type { ActionResult } from "@/shared/action-result";
import { handleActionError } from "@/shared/errors/action-error";

const productRepository = new FirestoreProductRepository();
const MAX_FILE_BYTES = 5 * 1024 * 1024;

export type BulkImportValidatePayload = {
  products: BulkImportPreviewProduct[];
  rowErrors: BulkImportRowError[];
  groupErrors: Array<{ sku_base: string; message: string }>;
  readyCount: number;
  /** Inputs serializáveis para execução em chunks */
  readyItems: Array<{ sku_base: string; input: CreateProductInput }>;
};

export async function generateBulkImportTemplateAction(): Promise<
  ActionResult<{ base64: string; fileName: string }>
> {
  const auth = await requireAdminSession();
  if ("error" in auth) return { success: false, error: auth.error };

  try {
    const buffer = await generateBulkImportTemplateBuffer();
    return {
      success: true,
      data: {
        base64: buffer.toString("base64"),
        fileName: "aurora-produtos-importacao.xlsx",
      },
    };
  } catch (error) {
    const { message } = handleActionError(
      "generateBulkImportTemplateAction",
      error,
      "admin",
    );
    return { success: false, error: message };
  }
}

export async function parseAndValidateBulkImportAction(
  formData: FormData,
): Promise<ActionResult<BulkImportValidatePayload>> {
  const auth = await requireAdminSession();
  if ("error" in auth) return { success: false, error: auth.error };

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { success: false, error: "Arquivo não enviado" };
  }

  if (file.size > MAX_FILE_BYTES) {
    return {
      success: false,
      error: "Arquivo muito grande (máximo 5 MB)",
    };
  }

  const ext = file.name.toLowerCase();
  if (!ext.endsWith(".xlsx")) {
    return { success: false, error: "Envie um arquivo .xlsx" };
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const { rows, errors: parseErrors } = await parseXlsxBuffer(
      buffer,
      cloudName,
    );

    const validation = validateBulkImportRows(rows);
    const rowErrors = [...parseErrors, ...validation.rowErrors];

    const readyItems = validation.readyInputs
      .filter((r) => r.ok)
      .map((r) => ({
        sku_base: r.sku_base,
        input: r.input,
      }));

    return {
      success: true,
      data: {
        products: validation.products,
        rowErrors,
        groupErrors: validation.groupErrors,
        readyCount: readyItems.length,
        readyItems,
      },
    };
  } catch (error) {
    const { message } = handleActionError(
      "parseAndValidateBulkImportAction",
      error,
      "admin",
    );
    return { success: false, error: message };
  }
}

export type BulkImportChunkResult = {
  created: Array<{ sku_base: string; id: string; title: string }>;
  failed: Array<{ sku_base: string; error: string }>;
};

export async function executeBulkImportChunkAction(
  items: Array<{ sku_base: string; input: CreateProductInput }>,
): Promise<ActionResult<BulkImportChunkResult>> {
  const auth = await requireAdminSession();
  if ("error" in auth) return { success: false, error: auth.error };

  if (!items.length || items.length > 50) {
    return {
      success: false,
      error: "Chunk inválido (1 a 50 produtos por vez)",
    };
  }

  try {
    const useCase = new BulkImportProductsUseCase(productRepository);
    const result = await useCase.execute(items);
    return { success: true, data: result };
  } catch (error) {
    const { message } = handleActionError(
      "executeBulkImportChunkAction",
      error,
      "admin",
    );
    return { success: false, error: message };
  }
}

export async function finalizeBulkImportJobAction(payload: {
  total: number;
  success: number;
  failed: number;
  errors: Array<{ sku_base: string; error: string }>;
}): Promise<ActionResult<{ jobId: string | null }>> {
  const auth = await requireAdminSession();
  if ("error" in auth) return { success: false, error: auth.error };

  const jobId = await saveImportJob({
    adminEmail: auth.email,
    startedAt: new Date(),
    finishedAt: new Date(),
    total: payload.total,
    success: payload.success,
    failed: payload.failed,
    errors: payload.errors.map((e) => ({
      sku_base: e.sku_base,
      message: e.error,
    })),
  });

  return { success: true, data: { jobId } };
}
