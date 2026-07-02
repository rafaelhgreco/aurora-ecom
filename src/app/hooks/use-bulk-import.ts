"use client";

import { useCallback, useState } from "react";
import {
  type BulkImportChunkResult,
  type BulkImportValidatePayload,
  executeBulkImportChunkAction,
  finalizeBulkImportJobAction,
} from "@/app/actions/bulk-import";
import type { CreateProductInput } from "@/core/schemas/product.schema";

const CHUNK_SIZE = 25;

export type BulkImportPhase =
  | "idle"
  | "validating"
  | "preview"
  | "importing"
  | "done";

export type BulkImportSummary = {
  total: number;
  success: number;
  failed: number;
  created: BulkImportChunkResult["created"];
  errors: Array<{ sku_base: string; error: string }>;
  jobId: string | null;
};

export function useBulkImport() {
  const [phase, setPhase] = useState<BulkImportPhase>("idle");
  const [validation, setValidation] =
    useState<BulkImportValidatePayload | null>(null);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [summary, setSummary] = useState<BulkImportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setPhase("idle");
    setValidation(null);
    setProgress({ done: 0, total: 0 });
    setSummary(null);
    setError(null);
  }, []);

  const setPreview = useCallback((data: BulkImportValidatePayload) => {
    setValidation(data);
    setPhase("preview");
    setError(null);
  }, []);

  const runImport = useCallback(async () => {
    if (!validation?.readyItems.length) return;

    const items = validation.readyItems;
    setPhase("importing");
    setProgress({ done: 0, total: items.length });
    setError(null);

    const allCreated: BulkImportChunkResult["created"] = [];
    const allFailed: Array<{ sku_base: string; error: string }> = [];

    for (let i = 0; i < items.length; i += CHUNK_SIZE) {
      const chunk = items.slice(i, i + CHUNK_SIZE) as Array<{
        sku_base: string;
        input: CreateProductInput;
      }>;

      const result = await executeBulkImportChunkAction(chunk);
      if (!result.success) {
        setError(result.error);
        setPhase("preview");
        return;
      }

      allCreated.push(...result.data.created);
      allFailed.push(...result.data.failed);
      setProgress({
        done: Math.min(i + chunk.length, items.length),
        total: items.length,
      });
    }

    const finalize = await finalizeBulkImportJobAction({
      total: items.length,
      success: allCreated.length,
      failed: allFailed.length,
      errors: allFailed,
    });

    setSummary({
      total: items.length,
      success: allCreated.length,
      failed: allFailed.length,
      created: allCreated,
      errors: allFailed,
      jobId: finalize.success ? finalize.data.jobId : null,
    });
    setPhase("done");
  }, [validation]);

  return {
    phase,
    validation,
    progress,
    summary,
    error,
    reset,
    setPreview,
    setPhase,
    runImport,
  };
}
