/**
 * Script para criar o admin no Firestore.
 * Uso: npm run seed:admin -- <email> <senha>
 *
 * Carrega variáveis do .env. Requer FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY.
 */

import * as dotenv from "dotenv";

dotenv.config();

import * as bcrypt from "bcryptjs";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const COLLECTION = "config";
const ADMIN_DOC_ID = "admin";

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  const password = process.argv[3];

  if (!email || !password) {
    console.error("Uso: npm run seed:admin -- <email> <senha>");
    process.exit(1);
  }

  if (password.length < 6) {
    console.error("Senha deve ter no mínimo 6 caracteres.");
    process.exit(1);
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    console.error(
      "Defina FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY.",
    );
    console.error(
      "Ou use GOOGLE_APPLICATION_CREDENTIALS apontando para o JSON da service account.",
    );
    process.exit(1);
  }

  if (getApps().length === 0) {
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }

  const db = getFirestore();
  const passwordHash = await bcrypt.hash(password, 12);

  await db.collection(COLLECTION).doc(ADMIN_DOC_ID).set(
    {
      email,
      passwordHash,
      createdAt: new Date(),
    },
    { merge: true },
  );

  console.log(`Admin criado/atualizado: ${email}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
