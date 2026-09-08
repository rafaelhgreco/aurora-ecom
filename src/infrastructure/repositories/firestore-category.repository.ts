import { Timestamp } from "firebase-admin/firestore";
import type { ICategoryRepository } from "@/core/repositories/category.repository.interface";
import type { Category } from "@/core/schemas/category.schema";
import { getAdminDb } from "@/infrastructure/lib/firebase-admin";
import { InternalError } from "@/shared/errors/internal-error";

/**
 * Firestore (Admin SDK) — mesmo transporte usado pelos demais repositórios do admin.
 */
export class FirestoreCategoryRepository implements ICategoryRepository {
  private collectionName = "categories";

  private requireDb() {
    const db = getAdminDb();
    if (!db) {
      throw new InternalError("firebase_admin_not_initialized");
    }
    return db;
  }

  private docToCategory(id: string, data: Record<string, unknown>): Category {
    const toDate = (timestamp: unknown): Date => {
      if (timestamp && typeof timestamp === "object" && "toDate" in timestamp) {
        return (timestamp as { toDate: () => Date }).toDate();
      }
      return new Date();
    };

    return {
      id,
      // Fallback defensivo para documentos legados sem `sectionId`.
      sectionId: (data.sectionId as string) || "roupas",
      name: data.name as string,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    };
  }

  async findAll(): Promise<Category[]> {
    const db = this.requireDb();
    const snapshot = await db
      .collection(this.collectionName)
      .orderBy("name")
      .get();

    return snapshot.docs.map((d) =>
      this.docToCategory(d.id, d.data() as Record<string, unknown>),
    );
  }

  async findById(id: string): Promise<Category | null> {
    const db = this.requireDb();
    const docSnap = await db.collection(this.collectionName).doc(id).get();

    if (!docSnap.exists) {
      return null;
    }

    return this.docToCategory(
      docSnap.id,
      docSnap.data() as Record<string, unknown>,
    );
  }

  async findByNameCaseInsensitiveInSection(
    sectionId: string,
    name: string,
  ): Promise<Category | null> {
    const needle = name.trim().toLowerCase();
    const all = await this.findAll();
    return (
      all.find(
        (c) =>
          c.sectionId === sectionId && c.name.trim().toLowerCase() === needle,
      ) ?? null
    );
  }

  async create(
    category: Omit<Category, "id" | "createdAt" | "updatedAt">,
  ): Promise<Category> {
    const db = this.requireDb();
    const now = Timestamp.now();
    const docRef = await db.collection(this.collectionName).add({
      sectionId: category.sectionId,
      name: category.name,
      createdAt: now,
      updatedAt: now,
    });

    return {
      id: docRef.id,
      sectionId: category.sectionId,
      name: category.name,
      createdAt: now.toDate(),
      updatedAt: now.toDate(),
    };
  }

  async update(id: string, category: Partial<Category>): Promise<Category> {
    const db = this.requireDb();
    const docRef = db.collection(this.collectionName).doc(id);

    const updateData: Record<string, unknown> = {
      updatedAt: Timestamp.now(),
    };
    if (category.name !== undefined) updateData.name = category.name;
    if (category.sectionId !== undefined)
      updateData.sectionId = category.sectionId;

    await docRef.update(updateData);

    const updated = await this.findById(id);
    if (!updated) {
      throw new InternalError("category_not_found_after_update");
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
