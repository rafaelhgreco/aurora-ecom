/**
 * Script de migração única: cria as seções iniciais do catálogo (Roupas,
 * Produtos Aurora) com ids fixos "roupas"/"cabelos", compatíveis com
 * produtos já cadastrados (`product.shopCategory`) e com a importação em
 * massa (planilha), que continua usando esses dois ids.
 * Uso: npm run seed:sections
 *
 * Idempotente (usa `set` com `merge: true`) — seguro rodar de novo.
 * Carrega variáveis do .env. Requer FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY.
 */

import * as dotenv from "dotenv";

dotenv.config();

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

const COLLECTION = "sections";

const SEED_SECTIONS = [
  {
    id: "roupas",
    name: "Roupas",
    slug: "roupas",
    description: "Peças e coleções de vestuário.",
  },
  {
    id: "cabelos",
    name: "Produtos Aurora",
    slug: "produtos-aurora",
    description: "Linha Cabelos e Produtos Aurora.",
  },
];

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
  const now = Timestamp.now();

  for (const section of SEED_SECTIONS) {
    const { id, ...data } = section;
    const ref = db.collection(COLLECTION).doc(id);
    const existing = await ref.get();

    if (existing.exists) {
      console.log(`Seção "${section.name}" (${id}) já existe, pulando.`);
      continue;
    }

    await ref.set({
      ...data,
      createdAt: now,
      updatedAt: now,
    });
    console.log(`Seção "${section.name}" (${id}) criada.`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
