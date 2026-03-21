import { getAdminDb } from "@/infrastructure/lib/firebase-admin";

const COLLECTION = "config";
const ADMIN_DOC_ID = "admin";

export interface AdminDoc {
  email: string;
  passwordHash: string;
}

export async function getAdminFromFirestore(): Promise<AdminDoc | null> {
  const db = getAdminDb();
  if (!db) return null;

  const snap = await db.collection(COLLECTION).doc(ADMIN_DOC_ID).get();
  if (!snap.exists) return null;

  const data = snap.data();
  return {
    email: (data?.email as string) ?? "",
    passwordHash: (data?.passwordHash as string) ?? "",
  };
}
