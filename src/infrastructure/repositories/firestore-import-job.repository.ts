import { Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/infrastructure/lib/firebase-admin";

const COLLECTION = "product_import_jobs";

export type ImportJobError = {
  sku_base: string;
  message: string;
};

export type ImportJobRecord = {
  id?: string;
  adminEmail: string;
  startedAt: Date;
  finishedAt?: Date;
  total: number;
  success: number;
  failed: number;
  errors: ImportJobError[];
};

export async function saveImportJob(
  record: Omit<ImportJobRecord, "id">,
): Promise<string | null> {
  const db = getAdminDb();
  if (!db) return null;

  const doc = await db.collection(COLLECTION).add({
    adminEmail: record.adminEmail,
    startedAt: Timestamp.fromDate(record.startedAt),
    finishedAt: record.finishedAt
      ? Timestamp.fromDate(record.finishedAt)
      : null,
    total: record.total,
    success: record.success,
    failed: record.failed,
    errors: record.errors,
  });

  return doc.id;
}
