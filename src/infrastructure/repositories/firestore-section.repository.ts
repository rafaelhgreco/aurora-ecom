import { Timestamp } from "firebase-admin/firestore";
import type { ISectionRepository } from "@/core/repositories/section.repository.interface";
import type { Section } from "@/core/schemas/section.schema";
import { getAdminDb } from "@/infrastructure/lib/firebase-admin";
import { InternalError } from "@/shared/errors/internal-error";

/**
 * Firestore (Admin SDK) — mesmo transporte usado pelos demais repositórios do admin.
 * As seções seed (Roupas/Cabelos) usam ids fixos definidos em `scripts/seed-sections.ts`,
 * não gerados por `.add()`.
 */
export class FirestoreSectionRepository implements ISectionRepository {
  private collectionName = "sections";

  private requireDb() {
    const db = getAdminDb();
    if (!db) {
      throw new InternalError("firebase_admin_not_initialized");
    }
    return db;
  }

  private docToSection(id: string, data: Record<string, unknown>): Section {
    const toDate = (timestamp: unknown): Date => {
      if (timestamp && typeof timestamp === "object" && "toDate" in timestamp) {
        return (timestamp as { toDate: () => Date }).toDate();
      }
      return new Date();
    };

    return {
      id,
      name: data.name as string,
      slug: data.slug as string,
      description: (data.description as string) || undefined,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
    };
  }

  async findAll(): Promise<Section[]> {
    const db = this.requireDb();
    const snapshot = await db
      .collection(this.collectionName)
      .orderBy("name")
      .get();

    return snapshot.docs.map((d) =>
      this.docToSection(d.id, d.data() as Record<string, unknown>),
    );
  }

  async findById(id: string): Promise<Section | null> {
    const db = this.requireDb();
    const docSnap = await db.collection(this.collectionName).doc(id).get();

    if (!docSnap.exists) {
      return null;
    }

    return this.docToSection(
      docSnap.id,
      docSnap.data() as Record<string, unknown>,
    );
  }

  async findBySlug(slug: string): Promise<Section | null> {
    const db = this.requireDb();
    const snap = await db
      .collection(this.collectionName)
      .where("slug", "==", slug)
      .limit(1)
      .get();

    if (snap.empty) {
      return null;
    }

    const doc = snap.docs[0];
    return this.docToSection(doc.id, doc.data() as Record<string, unknown>);
  }

  async findByNameCaseInsensitive(name: string): Promise<Section | null> {
    const needle = name.trim().toLowerCase();
    const all = await this.findAll();
    return all.find((s) => s.name.trim().toLowerCase() === needle) ?? null;
  }

  async create(
    section: Omit<Section, "id" | "createdAt" | "updatedAt">,
  ): Promise<Section> {
    const db = this.requireDb();
    const now = Timestamp.now();
    const docRef = await db.collection(this.collectionName).add({
      name: section.name,
      slug: section.slug,
      description: section.description || null,
      createdAt: now,
      updatedAt: now,
    });

    return {
      id: docRef.id,
      name: section.name,
      slug: section.slug,
      description: section.description,
      createdAt: now.toDate(),
      updatedAt: now.toDate(),
    };
  }

  async update(id: string, section: Partial<Section>): Promise<Section> {
    const db = this.requireDb();
    const docRef = db.collection(this.collectionName).doc(id);

    const updateData: Record<string, unknown> = {
      updatedAt: Timestamp.now(),
    };
    if (section.name !== undefined) updateData.name = section.name;
    if (section.slug !== undefined) updateData.slug = section.slug;
    if (section.description !== undefined)
      updateData.description = section.description || null;

    await docRef.update(updateData);

    const updated = await this.findById(id);
    if (!updated) {
      throw new InternalError("section_not_found_after_update");
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
