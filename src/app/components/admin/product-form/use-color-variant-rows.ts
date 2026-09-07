import { useCallback, useEffect, useRef, useState } from "react";
import type { ProductSize } from "@/core/schemas/product.schema";

export const MAX_COLORS = 12;
export const MAX_IMAGES_PER_COLOR = 10;

export type ColorEditRow = {
  id: string;
  color: string;
  existingUrls: string[];
  files: File[];
  previews: string[];
  stockBySize: Partial<Record<ProductSize, number>>;
};

interface UseColorVariantRowsArgs {
  initialRows: ColorEditRow[];
  selectedSizes: ProductSize[];
}

/**
 * Estado e handlers das linhas de "cor" (nome + fotos + estoque por tamanho),
 * compartilhado entre cadastro e edição/enriquecimento de produto.
 */
export function useColorVariantRows({
  initialRows,
  selectedSizes,
}: UseColorVariantRowsArgs) {
  const [colorRows, setColorRows] = useState<ColorEditRow[]>(initialRows);
  const nextColorRowIdRef = useRef(initialRows.length);

  useEffect(() => {
    setColorRows((prev) =>
      prev.map((row) => {
        const next = { ...row.stockBySize };
        for (const s of selectedSizes) {
          if (!(s in next)) next[s] = 0;
        }
        for (const k of Object.keys(next)) {
          if (!selectedSizes.includes(k as ProductSize)) {
            delete next[k as ProductSize];
          }
        }
        return { ...row, stockBySize: next };
      }),
    );
  }, [selectedSizes]);

  const resetRows = useCallback((rows: ColorEditRow[]) => {
    nextColorRowIdRef.current = rows.length;
    setColorRows(rows);
  }, []);

  const addColorRow = useCallback(() => {
    if (colorRows.length >= MAX_COLORS) return;
    const stockBySize: Partial<Record<ProductSize, number>> = {};
    for (const s of selectedSizes) {
      stockBySize[s] = 0;
    }
    setColorRows((prev) => [
      ...prev,
      {
        id: String(nextColorRowIdRef.current++),
        color: "",
        existingUrls: [],
        files: [],
        previews: [],
        stockBySize,
      },
    ]);
  }, [colorRows.length, selectedSizes]);

  const removeColorRow = useCallback(
    (rowIndex: number) => {
      if (colorRows.length <= 1) return;
      setColorRows((prev) => {
        const row = prev[rowIndex];
        for (const p of row.previews) {
          URL.revokeObjectURL(p);
        }
        return prev.filter((_, i) => i !== rowIndex);
      });
    },
    [colorRows.length],
  );

  const setRowColor = useCallback((rowIndex: number, color: string) => {
    setColorRows((prev) =>
      prev.map((r, i) => (i === rowIndex ? { ...r, color } : r)),
    );
  }, []);

  const addRowImageFiles = useCallback((rowIndex: number, files: File[]) => {
    if (files.length === 0) return;

    setColorRows((prev) => {
      const row = prev[rowIndex];
      const room =
        MAX_IMAGES_PER_COLOR - row.existingUrls.length - row.files.length;
      if (room <= 0) return prev;
      const toAdd = files.slice(0, room);
      const newPreviews = toAdd.map((f) => URL.createObjectURL(f));
      return prev.map((r, i) =>
        i === rowIndex
          ? {
              ...r,
              files: [...r.files, ...toAdd],
              previews: [...r.previews, ...newPreviews],
            }
          : r,
      );
    });
  }, []);

  const removeExistingUrl = useCallback(
    (rowIndex: number, imageIndex: number) => {
      setColorRows((prev) =>
        prev.map((r, i) =>
          i === rowIndex
            ? {
                ...r,
                existingUrls: r.existingUrls.filter((_, j) => j !== imageIndex),
              }
            : r,
        ),
      );
    },
    [],
  );

  const removeNewFile = useCallback((rowIndex: number, imageIndex: number) => {
    setColorRows((prev) =>
      prev.map((r, i) => {
        if (i !== rowIndex) return r;
        URL.revokeObjectURL(r.previews[imageIndex]);
        return {
          ...r,
          files: r.files.filter((_, j) => j !== imageIndex),
          previews: r.previews.filter((_, j) => j !== imageIndex),
        };
      }),
    );
  }, []);

  const adjustRowStock = useCallback(
    (rowIndex: number, size: ProductSize, delta: number) => {
      setColorRows((prev) =>
        prev.map((r, i) => {
          if (i !== rowIndex) return r;
          const prevQty = r.stockBySize[size] ?? 0;
          return {
            ...r,
            stockBySize: {
              ...r.stockBySize,
              [size]: Math.max(0, prevQty + delta),
            },
          };
        }),
      );
    },
    [],
  );

  return {
    colorRows,
    resetRows,
    addColorRow,
    removeColorRow,
    setRowColor,
    addRowImageFiles,
    removeExistingUrl,
    removeNewFile,
    adjustRowStock,
  };
}
