import { Timestamp } from "firebase-admin/firestore";
import type {
  Order,
  OrderItem,
  OrderStatus,
} from "@/core/schemas/order.schema";
import { getAdminDb } from "@/infrastructure/lib/firebase-admin";
import { InternalError } from "@/shared/errors/internal-error";

const COLLECTION = "orders";

function toDate(val: unknown): Date {
  if (val && typeof val === "object" && "toDate" in val) {
    return (val as { toDate: () => Date }).toDate();
  }
  return new Date();
}

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
      createdAt: toDate(d.createdAt),
      updatedAt: toDate(d.updatedAt),
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
    createdAt: toDate(d.createdAt),
    updatedAt: toDate(d.updatedAt),
  };
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
