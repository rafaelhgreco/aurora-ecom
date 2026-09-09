import { Timestamp } from "firebase-admin/firestore";
import type { IPromotionRepository } from "@/core/repositories/promotion.repository.interface";
import type { Promotion } from "@/core/schemas/promotion.schema";
import { getAdminDb } from "@/infrastructure/lib/firebase-admin";
import { InternalError } from "@/shared/errors/internal-error";
import { timestampToDate } from "@/shared/timestamp";

/**
 * Firestore (Admin SDK) — mesmo transporte usado pelos demais repositórios do admin.
 */
export class FirestorePromotionRepository implements IPromotionRepository {
  private collectionName = "promotions";

  private requireDb() {
    const db = getAdminDb();
    if (!db) {
      throw new InternalError("firebase_admin_not_initialized");
    }
    return db;
  }

  private docToPromotion(id: string, data: Record<string, unknown>): Promotion {
    return {
      id,
      name: data.name as string,
      discountPercentage: data.discountPercentage as number,
      active: (data.active as boolean) ?? true,
      createdAt: timestampToDate(data.createdAt),
      updatedAt: timestampToDate(data.updatedAt),
    };
  }

  async findAll(): Promise<Promotion[]> {
    const db = this.requireDb();
    const snapshot = await db
      .collection(this.collectionName)
      .orderBy("name")
      .get();

    return snapshot.docs.map((d) =>
      this.docToPromotion(d.id, d.data() as Record<string, unknown>),
    );
  }

  async findById(id: string): Promise<Promotion | null> {
    const db = this.requireDb();
    const docSnap = await db.collection(this.collectionName).doc(id).get();

    if (!docSnap.exists) {
      return null;
    }

    return this.docToPromotion(
      docSnap.id,
      docSnap.data() as Record<string, unknown>,
    );
  }

  async findByNameCaseInsensitive(name: string): Promise<Promotion | null> {
    const needle = name.trim().toLowerCase();
    const all = await this.findAll();
    return all.find((p) => p.name.trim().toLowerCase() === needle) ?? null;
  }

  async create(
    promotion: Omit<Promotion, "id" | "createdAt" | "updatedAt">,
  ): Promise<Promotion> {
    const db = this.requireDb();
    const now = Timestamp.now();
    const docRef = await db.collection(this.collectionName).add({
      name: promotion.name,
      discountPercentage: promotion.discountPercentage,
      active: promotion.active,
      createdAt: now,
      updatedAt: now,
    });

    return {
      id: docRef.id,
      name: promotion.name,
      discountPercentage: promotion.discountPercentage,
      active: promotion.active,
      createdAt: now.toDate(),
      updatedAt: now.toDate(),
    };
  }

  async update(id: string, promotion: Partial<Promotion>): Promise<Promotion> {
    const db = this.requireDb();
    const docRef = db.collection(this.collectionName).doc(id);

    const updateData: Record<string, unknown> = {
      updatedAt: Timestamp.now(),
    };
    if (promotion.name !== undefined) updateData.name = promotion.name;
    if (promotion.discountPercentage !== undefined)
      updateData.discountPercentage = promotion.discountPercentage;
    if (promotion.active !== undefined) updateData.active = promotion.active;

    await docRef.update(updateData);

    const updated = await this.findById(id);
    if (!updated) {
      throw new InternalError("promotion_not_found_after_update");
    }

    return updated;
  }

  async delete(id: string): Promise<void> {
    const db = this.requireDb();
    await db.collection(this.collectionName).doc(id).delete();
  }

  async exists(id: string): Promise<boolean> {
    const db = this.requireDb();
    const docSnap = await db.collection(this.collectionName).doc(id).get();
    return docSnap.exists;
  }
}
