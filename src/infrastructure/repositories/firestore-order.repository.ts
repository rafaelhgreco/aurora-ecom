import { Timestamp } from "firebase-admin/firestore";
import type {
  Order,
  OrderItem,
  OrderStatus,
} from "@/core/schemas/order.schema";
import { getAdminDb } from "@/infrastructure/lib/firebase-admin";
import { InternalError } from "@/shared/errors/internal-error";
import { timestampToDate } from "@/shared/timestamp";

const COLLECTION = "orders";

export async function createOrder(
  items: OrderItem[],
  total: number,
): Promise<Order> {
  const db = getAdminDb();
  if (!db) throw new InternalError("firebase_admin_not_initialized");

  const now = new Date();
  const data = {
    items,
    total,
    status: "PENDENTE" as OrderStatus,
    createdAt: Timestamp.fromDate(now),
    updatedAt: Timestamp.fromDate(now),
  };

  const docRef = await db.collection(COLLECTION).add(data);

  return {
    id: docRef.id,
    items,
    total,
    status: "PENDENTE",
    createdAt: now,
    updatedAt: now,
  };
}

export async function listOrders(options?: {
  limitCount?: number;
  page?: number;
  status?: OrderStatus;
}): Promise<{ data: Order[]; totalCount: number }> {
  const db = getAdminDb();
  if (!db) return { data: [], totalCount: 0 };

  const { limitCount = 20, page = 1, status } = options || {};

  let query: FirebaseFirestore.Query = db.collection(COLLECTION);

  if (status) {
    query = query.where("status", "==", status);
  }

  const countSnapshot = await query.count().get();
  const totalCount = countSnapshot.data().count;

  query = query.orderBy("createdAt", "desc");

  const offset = (page - 1) * limitCount;
  if (offset > 0) {
    query = query.offset(offset);
  }

  const snapshot = await query.limit(limitCount).get();

  const data = snapshot.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      items: (d.items as OrderItem[]) || [],
      total: (d.total as number) || 0,
      status: (d.status as OrderStatus) || "PENDENTE",
      createdAt: timestampToDate(d.createdAt),
      updatedAt: timestampToDate(d.updatedAt),
    };
  });

  return { data, totalCount };
}

export async function getOrderById(id: string): Promise<Order | null> {
  const db = getAdminDb();
  if (!db) return null;

  const doc = await db.collection(COLLECTION).doc(id).get();
  if (!doc.exists) return null;

  const d = doc.data();
  if (!d) return null;

  return {
    id: doc.id,
    items: (d.items as OrderItem[]) || [],
    total: (d.total as number) || 0,
    status: (d.status as OrderStatus) || "PENDENTE",
    createdAt: timestampToDate(d.createdAt),
    updatedAt: timestampToDate(d.updatedAt),
  };
}

/**
 * Busca todos os pedidos, sem paginação de UI (para exportação/limpeza em lote).
 * Pagina internamente por cursor para não estourar uma única leitura.
 */
export async function listAllOrders(): Promise<Order[]> {
  const db = getAdminDb();
  if (!db) return [];

  const pageSize = 500;
  const all: Order[] = [];
  let lastDoc: FirebaseFirestore.QueryDocumentSnapshot | undefined;

  while (true) {
    let query: FirebaseFirestore.Query = db
      .collection(COLLECTION)
      .orderBy("createdAt", "desc")
      .limit(pageSize);

    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }

    const snapshot = await query.get();

    for (const doc of snapshot.docs) {
      const d = doc.data();
      all.push({
        id: doc.id,
        items: (d.items as OrderItem[]) || [],
        total: (d.total as number) || 0,
        status: (d.status as OrderStatus) || "PENDENTE",
        createdAt: timestampToDate(d.createdAt),
        updatedAt: timestampToDate(d.updatedAt),
      });
    }

    if (snapshot.docs.length < pageSize) break;
    lastDoc = snapshot.docs[snapshot.docs.length - 1];
  }

  return all;
}

/**
 * Apaga todos os pedidos informados em lotes pequenos.
 * Chunks bem abaixo do limite de 500 ops/batch do Firestore: se um id do
 * meio já tiver sido removido, `batch.delete` rejeita o batch inteiro —
 * chunks menores reduzem quantos pedidos ficam de fora nesse caso.
 */
export async function deleteAllOrders(
  ids: string[],
): Promise<{ deletedCount: number; failedIds: string[] }> {
  const db = getAdminDb();
  if (!db) return { deletedCount: 0, failedIds: ids };

  const collection = db.collection(COLLECTION);
  const chunkSize = 100;
  let deletedCount = 0;
  const failedIds: string[] = [];

  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    const batch = db.batch();
    for (const id of chunk) {
      batch.delete(collection.doc(id));
    }
    try {
      await batch.commit();
      deletedCount += chunk.length;
    } catch {
      failedIds.push(...chunk);
    }
  }

  return { deletedCount, failedIds };
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
): Promise<Order | null> {
  const db = getAdminDb();
  if (!db) return null;

  const now = new Date();
  await db
    .collection(COLLECTION)
    .doc(id)
    .update({
      status,
      updatedAt: Timestamp.fromDate(now),
    });

  return getOrderById(id);
}
