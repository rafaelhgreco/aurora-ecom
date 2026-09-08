/**
 * Script de migração única: gera `slug` para produtos que ainda não têm.
 * Uso: npm run backfill:product-slugs
 *
 * Idempotente — produtos que já têm slug são pulados, seguro rodar de novo.
 * Carrega variáveis do .env. Requer FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY.
 */

import * as dotenv from "dotenv";

dotenv.config();

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { slugify } from "@/shared/slugify";

const COLLECTION = "products";

function resolveUniqueSlug(
  desiredSlug: string,
  usedSlugs: Set<string>,
): string {
  let candidate = desiredSlug || "produto";
  let suffix = 2;
  while (usedSlugs.has(candidate)) {
    candidate = `${desiredSlug || "produto"}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

async function main() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    console.error(
      "Defina FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY.",
    );
    process.exit(1);
  }

  if (getApps().length === 0) {
    initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  }

  const db = getFirestore();
  const snapshot = await db.collection(COLLECTION).get();

  const usedSlugs = new Set<string>();
  const missingSlugDocs: Array<{ id: string; title: string }> = [];

  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (typeof data.slug === "string" && data.slug.length > 0) {
      usedSlugs.add(data.slug);
    } else {
      missingSlugDocs.push({ id: doc.id, title: data.title ?? "" });
    }
  }

  console.log(
    `${snapshot.size} produtos encontrados, ${missingSlugDocs.length} sem slug.`,
  );

  for (const { id, title } of missingSlugDocs) {
    const base = slugify(title) || "produto";
    const slug = resolveUniqueSlug(base, usedSlugs);
    usedSlugs.add(slug);
    await db.collection(COLLECTION).doc(id).update({ slug });
    console.log(`  ${id} -> "${slug}"`);
  }

  console.log("Concluído.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
