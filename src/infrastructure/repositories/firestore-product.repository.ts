import { FieldValue, type Query, Timestamp } from "firebase-admin/firestore";
import type { ShopCategoryId } from "@/core/catalog/shop-catalog";
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
      title: data.title as string,
      subtitle: data.subtitle as string | undefined,
      description: data.description as string,
      price: data.price as number,
      imageUrl: data.imageUrl as string,
      images: (data.images as string[]) || [],
      category: data.category as string | undefined,
      shopCategory: data.shopCategory as ShopCategoryId | undefined,
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

    if (filters?.category) {
      q = q.where("category", "==", filters.category);
    }

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

    // Because we filter client-side for search, sizes, shopCategory, we might have an issue
    // applying offset and limit here directly on the query.
    // Let's fetch the relevant docs, then filter, then paginate.

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

  async createOrIncrementByBarcode(
    barcode: string,
    draftFactory: () => Omit<ProductEntity, "id" | "createdAt" | "updatedAt">,
  ): Promise<{ product: ProductEntity; created: boolean }> {
    console.log(
      "[FirestoreProductRepository] createOrIncrementByBarcode chamado para barcode:",
      barcode,
    );
    const db = this.requireDb();
    const docRef = db.collection(this.collectionName).doc(barcode);

    try {
      const draft = draftFactory();
      console.log("[FirestoreProductRepository] draft gerado:", draft);

      const docData = this.entityToDoc({
        ...draft,
        id: barcode,
        barcode,
      } as ProductEntity);
      console.log(
        "[FirestoreProductRepository] docData a ser criado:",
        docData,
      );

      await docRef.create(docData);
      console.log(
        "[FirestoreProductRepository] docRef.create() executado com sucesso para:",
        barcode,
      );

      const created = await this.findByBarcode(barcode);
      console.log(
        "[FirestoreProductRepository] produto recém-criado buscado:",
        created,
      );

      if (!created) {
        throw new InternalError("product_not_found_after_create");
      }

      return { product: created, created: true };
    } catch (error) {
      console.error(
        "[FirestoreProductRepository] erro capturado no create():",
        error,
      );
      const errorCode =
        error && typeof error === "object" && "code" in error
          ? (error as { code: unknown }).code
          : undefined;
      console.log(
        "[FirestoreProductRepository] error.code:",
        errorCode,
        "(6 = ALREADY_EXISTS esperado)",
      );

      if (errorCode === 6) {
        console.log(
          "[FirestoreProductRepository] barcode já existe, incrementando stock...",
        );
        await docRef.update({
          stock: FieldValue.increment(1),
          updatedAt: Timestamp.now(),
        });

        const updated = await this.findByBarcode(barcode);
        console.log(
          "[FirestoreProductRepository] produto após incremento:",
          updated,
        );
        if (!updated) {
          throw new InternalError("product_not_found_after_increment");
        }

        return { product: updated, created: false };
      }

      console.error(
        "[FirestoreProductRepository] erro não tratado, relançando:",
        error,
      );
      throw error;
    }
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
