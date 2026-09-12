"use client";

import { useEffect } from "react";
import { useDebounce } from "@/app/hooks/use-debounce";
import type {
  ProductFormInput,
  SizePresetKind,
} from "@/core/schemas/product.schema";
import type { ColorEditRow } from "./use-color-variant-rows";

export const PRODUCT_DRAFT_STORAGE_KEY = "aurora-ecom-product-draft";
const DRAFT_SAVE_DEBOUNCE_MS = 1500;

/** Sem `files`/`previews` — um `File` não sobrevive a um reload via localStorage. */
export type DraftColorRow = Pick<
  ColorEditRow,
  "id" | "color" | "existingUrls" | "stockBySize"
>;

export interface ProductDraft {
  savedAt: string;
  values: ProductFormInput;
  colorRows: DraftColorRow[];
  hasColorVariation: boolean;
  hasSizeVariation: boolean;
  sizePreset: SizePresetKind;
  /** Avisa o usuário que fotos locais ainda não enviadas foram perdidas. */
  hadUnsavedLocalPhotos: boolean;
}

export function toDraftColorRows(rows: ColorEditRow[]): DraftColorRow[] {
  return rows.map((r) => ({
    id: r.id,
    color: r.color,
    existingUrls: r.existingUrls,
    stockBySize: r.stockBySize,
  }));
}

export function draftColorRowsToEditRows(
  rows: DraftColorRow[],
): ColorEditRow[] {
  return rows.map((r) => ({ ...r, files: [], previews: [] }));
}

function readDraft(): ProductDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(PRODUCT_DRAFT_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as ProductDraft) : null;
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: sem serviço de log no cliente; falha aqui é silenciosa para o usuário (cai para formulário vazio)
    console.error("Erro ao carregar rascunho de produto:", error);
    return null;
  }
}

function writeDraft(draft: ProductDraft): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PRODUCT_DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: sem serviço de log no cliente; falha aqui é silenciosa para o usuário
    console.error("Erro ao salvar rascunho de produto:", error);
  }
}

export function clearDraft(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(PRODUCT_DRAFT_STORAGE_KEY);
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: sem serviço de log no cliente; falha aqui é silenciosa para o usuário
    console.error("Erro ao limpar rascunho de produto:", error);
  }
}

export function loadDraftOnce(): ProductDraft | null {
  return readDraft();
}

export function isDraftMeaningful(draft: ProductDraft): boolean {
  return Boolean(
    draft.values.title?.trim() ||
      draft.values.description?.trim() ||
      draft.colorRows.some((r) => r.color.trim() || r.existingUrls.length > 0),
  );
}

interface UseProductDraftAutoSaveArgs {
  enabled: boolean;
  values: ProductFormInput;
  colorRows: ColorEditRow[];
  hasColorVariation: boolean;
  hasSizeVariation: boolean;
  sizePreset: SizePresetKind;
}

/** Auto-save debounced do rascunho de cadastro (somente produto novo). */
export function useProductDraftAutoSave({
  enabled,
  values,
  colorRows,
  hasColorVariation,
  hasSizeVariation,
  sizePreset,
}: UseProductDraftAutoSaveArgs): void {
  const debouncedValues = useDebounce(values, DRAFT_SAVE_DEBOUNCE_MS);
  const debouncedColorRows = useDebounce(colorRows, DRAFT_SAVE_DEBOUNCE_MS);

  useEffect(() => {
    if (!enabled) return;
    const draft: ProductDraft = {
      savedAt: new Date().toISOString(),
      values: debouncedValues,
      colorRows: toDraftColorRows(debouncedColorRows),
      hasColorVariation,
      hasSizeVariation,
      sizePreset,
      hadUnsavedLocalPhotos: debouncedColorRows.some((r) => r.files.length > 0),
    };
    // Evita reescrever um rascunho vazio segundos depois de um reset
    // (descarte manual ou cadastro concluído com sucesso).
    if (isDraftMeaningful(draft)) {
      writeDraft(draft);
    } else {
      clearDraft();
    }
  }, [
    enabled,
    debouncedValues,
    debouncedColorRows,
    hasColorVariation,
    hasSizeVariation,
    sizePreset,
  ]);
}
