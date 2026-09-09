import { FieldValue, type Query, Timestamp } from "firebase-admin/firestore";
import { ProductEntity } from "@/core/entities/product.entity";
import type { IProductRepository } from "@/core/repositories/product.repository.interface";
import type { Product, ProductFilter } from "@/core/schemas/product.schema";
import { getAdminDb } from "@/infrastructure/lib/firebase-admin";
import { InternalError } from "@/shared/errors/internal-error";

/**
 * Firestore (Admin SDK + REST) — mesmo transporte que pedidos e auth admin.
 * Evita o SDK cliente no Node (Server Actions), onde gRPC/WebChannel costuma falhar em produção.
 */
export class FirestoreProductRepository implements IProductRepository {
  private collectionName = "products";

  private requireDb() {
    const db = getAdminDb();
    if (!db) {
      throw new InternalError("firebase_admin_not_initialized");
    }
    return db;
  }

  /**
   * Converte documento Firestore para ProductEntity
   */
  private docToEntity(
    id: string,
    data: Record<string, unknown>,
  ): ProductEntity {
    const toDate = (timestamp: unknown): Date => {
      if (timestamp && typeof timestamp === "object" && "toDate" in timestamp) {
        return (timestamp as { toDate: () => Date }).toDate();
      }
      return new Date();
    };

    return new ProductEntity({
      id,
      barcode: data.barcode as string | undefined,
      slug: data.slug as string | undefined,
      title: data.title as string,
      subtitle: data.subtitle as string | undefined,
      description: data.description as string,
      price: data.price as number,
      imageUrl: data.imageUrl as string,
      images: (data.images as string[]) || [],
      category: data.category as string | undefined,
      shopCategory: data.shopCategory as string | undefined,
      stock: data.stock as number,
      stockBySize: data.stockBySize as
        | Partial<Record<"PP" | "P" | "M" | "G" | "GG" | "XG", number>>
        | undefined,
      sizes: data.sizes as
        | Array<"PP" | "P" | "M" | "G" | "GG" | "XG">
        | undefined,
      colors: data.colors as string[] | undefined,
      colorVariants: data.colorVariants as Product["colorVariants"],
      isActive: (data.isActive as boolean) ?? true,
      status: (data.status as "DRAFT" | "ACTIVE") ?? "ACTIVE",
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
      deletedAt: data.deletedAt ? toDate(data.deletedAt) : null,
    });
  }

  /**
   * Converte ProductEntity para documento Firestore
   * Firestore não aceita `undefined` como valor de campo — campos opcionais
   * ausentes (ex.: subtitle, category em produtos DRAFT recém-bipados) são
   * removidos em vez de enviados como undefined.
   */
  private entityToDoc(entity: ProductEntity): Record<string, unknown> {
    const doc: Record<string, unknown> = {
      barcode: entity.barcode,
      slug: entity.slug,
      title: entity.title,
      subtitle: entity.subtitle,
      description: entity.description,
      price: entity.price,
      imageUrl: entity.imageUrl,
      images: entity.images,
      category: entity.category,
      shopCategory: entity.shopCategory,
      stock: entity.stock,
      stockBySize: entity.stockBySize,
      sizes: entity.sizes,
      colors: entity.colors,
      colorVariants: entity.colorVariants,
      isActive: entity.isActive,
      status: entity.status,
      createdAt: entity.createdAt
        ? Timestamp.fromDate(entity.createdAt)
        : Timestamp.now(),
      updatedAt: entity.updatedAt
        ? Timestamp.fromDate(entity.updatedAt)
        : Timestamp.now(),
      deletedAt: entity.deletedAt ? Timestamp.fromDate(entity.deletedAt) : null,
    };

    for (const key of Object.keys(doc)) {
      if (doc[key] === undefined) {
        delete doc[key];
      }
    }

    return doc;
  }

  async exists(id: string): Promise<boolean> {
    const db = this.requireDb();
    const docSnap = await db.collection(this.collectionName).doc(id).get();
    return docSnap.exists;
  }

  async findAll(
    filters?: ProductFilter,
  ): Promise<{ data: ProductEntity[]; totalCount: number }> {
    const db = this.requireDb();

    let q: Query = db
      .collection(this.collectionName)
      .where("deletedAt", "==", null);

    if (filters?.isActive !== undefined) {
      q = q.where("isActive", "==", filters.isActive);
    }

    if (filters?.status !== undefined) {
      q = q.where("status", "==", filters.status);
    }

    if (filters?.minPrice !== undefined) {
      q = q.where("price", ">=", filters.minPrice);
    }

    if (filters?.maxPrice !== undefined) {
      q = q.where("price", "<=", filters.maxPrice);
    }

    // Because we filter client-side for search, sizes, shopCategory, category,
    // we might have an issue applying offset and limit here directly on the query.
    // Let's fetch the relevant docs, then filter, then paginate.
    // `category` is filtered client-side (not via `.where`) to avoid requiring
    // a composite Firestore index for deletedAt+category+status+orderBy(createdAt).

    q = q.orderBy("createdAt", "desc");

    const snapshot = await q.get();

    let results = snapshot.docs.map((d) =>
      this.docToEntity(d.id, d.data() as Record<string, unknown>),
    );

    if (filters?.search) {
      const needle = filters.search.toLowerCase();
      results = results.filter(
        (p) =>
          p.title.toLowerCase().includes(needle) ||
          p.description.toLowerCase().includes(needle),
      );
    }

    if (filters?.sizes && filters.sizes.length > 0) {
      results = results.filter((p) =>
        p.sizes?.some((size) => filters.sizes?.includes(size)),
      );
    }

    if (filters?.shopCategory) {
      const target = filters.shopCategory;
      results = results.filter((p) => (p.shopCategory ?? "roupas") === target);
    }

    if (filters?.category) {
      results = results.filter((p) => p.category === filters.category);
    }

    const totalCount = results.length;

    const limitCount = filters?.limitCount ?? 20;
    const page = filters?.page ?? 1;
    const offset = (page - 1) * limitCount;

    const data = results.slice(offset, offset + limitCount);

    return { data, totalCount };
  }

  async findById(id: string): Promise<ProductEntity | null> {
    const db = this.requireDb();
    const docSnap = await db.collection(this.collectionName).doc(id).get();

    if (!docSnap.exists) {
      return null;
    }

    const data = docSnap.data() as Record<string, unknown>;

    if (data.deletedAt) {
      return null;
    }

    return this.docToEntity(docSnap.id, data);
  }

  async findBySlug(slug: string): Promise<ProductEntity | null> {
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
    const data = doc.data() as Record<string, unknown>;

    if (data.deletedAt) {
      return null;
    }

    return this.docToEntity(doc.id, data);
  }

  async create(product: ProductEntity): Promise<ProductEntity> {
    const db = this.requireDb();
    const docData = this.entityToDoc(product);
    const docRef = await db.collection(this.collectionName).add(docData);

    return new ProductEntity({
      ...product,
      id: docRef.id,
    });
  }

  async update(
    id: string,
    product: Partial<ProductEntity>,
  ): Promise<ProductEntity> {
    const db = this.requireDb();
    const docRef = db.collection(this.collectionName).doc(id);

    const updateData: Record<string, unknown> = {
      updatedAt: Timestamp.now(),
    };

    if (product.slug !== undefined) updateData.slug = product.slug;
    if (product.title !== undefined) updateData.title = product.title;
    if (product.subtitle !== undefined) updateData.subtitle = product.subtitle;
    if (product.description !== undefined)
      updateData.description = product.description;
    if (product.price !== undefined) updateData.price = product.price;
    if (product.imageUrl !== undefined) updateData.imageUrl = product.imageUrl;
    if (product.images !== undefined) updateData.images = product.images;
    if (product.category !== undefined) updateData.category = product.category;
    if (product.stock !== undefined) updateData.stock = product.stock;
    if (product.stockBySize !== undefined)
      updateData.stockBySize = product.stockBySize;
    if (product.sizes !== undefined) updateData.sizes = product.sizes;
    if (product.colors !== undefined) updateData.colors = product.colors;
    if (product.colorVariants !== undefined)
      updateData.colorVariants = product.colorVariants;
    if (product.shopCategory !== undefined)
      updateData.shopCategory = product.shopCategory;
    if (product.isActive !== undefined) updateData.isActive = product.isActive;
    if (product.status !== undefined) updateData.status = product.status;

    await docRef.update(updateData);

    const updated = await this.findById(id);
    if (!updated) {
      throw new InternalError("product_not_found_after_update");
    }

    return updated;
  }

  async bulkUpdateCategory(
    productIds: string[],
    category: string,
  ): Promise<{ updatedCount: number; failedIds: string[] }> {
    const db = this.requireDb();
    const collection = db.collection(this.collectionName);

    // Chunks pequenos (bem abaixo do limite de 500 ops/batch do Firestore):
    // se um id do meio já tiver sido apagado, `batch.update` rejeita o batch
    // inteiro — chunks menores reduzem quantos produtos ficam de fora nesse caso.
    const chunkSize = 100;
    let updatedCount = 0;
    const failedIds: string[] = [];

    for (let i = 0; i < productIds.length; i += chunkSize) {
      const chunk = productIds.slice(i, i + chunkSize);
      const batch = db.batch();
      for (const id of chunk) {
        batch.update(collection.doc(id), {
          category,
          updatedAt: Timestamp.now(),
        });
      }
      try {
        await batch.commit();
        updatedCount += chunk.length;
      } catch {
        failedIds.push(...chunk);
      }
    }

    return { updatedCount, failedIds };
  }

  async delete(id: string): Promise<void> {
    const db = this.requireDb();
    await db.collection(this.collectionName).doc(id).delete();
  }

  async findByBarcode(barcode: string): Promise<ProductEntity | null> {
    const db = this.requireDb();
    const docSnap = await db.collection(this.collectionName).doc(barcode).get();

    if (!docSnap.exists) {
      return null;
    }

    const data = docSnap.data() as Record<string, unknown>;

    if (data.deletedAt) {
      return null;
    }

    return this.docToEntity(docSnap.id, data);
  }

  async createDraftByBarcode(
    barcode: string,
    draftFactory: () => Omit<ProductEntity, "id" | "createdAt" | "updatedAt">,
  ): Promise<ProductEntity> {
    const db = this.requireDb();
    const draft = draftFactory();
    const docData = this.entityToDoc({
      ...draft,
      id: barcode,
      barcode,
    } as ProductEntity);

    // set() é idempotente: um retry de rede do SDK reenvia o mesmo payload
    // sem lançar erro, ao contrário de create() (que falha com ALREADY_EXISTS
    // no retry e faz o SDK ficar tentando por até 10min antes de desistir).
    await db.collection(this.collectionName).doc(barcode).set(docData);

    const created = await this.findByBarcode(barcode);
    if (!created) {
      throw new InternalError("product_not_found_after_create");
    }

    return created;
  }

  async incrementStockByBarcode(
    barcode: string,
    incrementBy: number,
  ): Promise<ProductEntity> {
    const db = this.requireDb();
    await db
      .collection(this.collectionName)
      .doc(barcode)
      .update({
        stock: FieldValue.increment(incrementBy),
        updatedAt: Timestamp.now(),
      });

    const updated = await this.findByBarcode(barcode);
    if (!updated) {
      throw new InternalError("product_not_found_after_increment");
    }

    return updated;
  }

  /**
   * Soft delete - marca como deletado sem remover do banco
   */
  async softDelete(id: string): Promise<void> {
    const db = this.requireDb();
    await db.collection(this.collectionName).doc(id).update({
      deletedAt: Timestamp.now(),
      isActive: false,
      updatedAt: Timestamp.now(),
    });
  }

  /**
   * Restaura um produto deletado
   */
  async restore(id: string): Promise<void> {
    const db = this.requireDb();
    await db.collection(this.collectionName).doc(id).update({
      deletedAt: null,
      updatedAt: Timestamp.now(),
    });
  }

  /**
   * Lista produtos deletados
   */
  async findDeleted(): Promise<ProductEntity[]> {
    const db = this.requireDb();
    const snapshot = await db
      .collection(this.collectionName)
      .where("deletedAt", "!=", null)
      .orderBy("deletedAt", "desc")
      .get();

    return snapshot.docs.map((d) =>
      this.docToEntity(d.id, d.data() as Record<string, unknown>),
    );
  }
}
