/**
 * Firebase Admin SDK — usado apenas no servidor (Server Actions).
 * Bypassa as regras do Firestore.
 */

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, initializeFirestore } from "firebase-admin/firestore";

/** Usar REST em vez de gRPC — evita erro DECODER routines::unsupported na Vercel */
const FIRESTORE_SETTINGS = { preferRest: true };

function initFirebaseAdmin() {
  if (getApps().length > 0) {
    const app = getApps()[0];
    return getFirestore(app);
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (projectId && clientEmail && privateKey) {
    const app = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    return initializeFirestore(app, FIRESTORE_SETTINGS);
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const app = initializeApp();
    return initializeFirestore(app, FIRESTORE_SETTINGS);
  }

  return null;
}

let _db: ReturnType<typeof getFirestore> | null = null;

export function getAdminDb(): ReturnType<typeof getFirestore> | null {
  if (_db === null) {
    _db = initFirebaseAdmin();
  }
  return _db;
}
