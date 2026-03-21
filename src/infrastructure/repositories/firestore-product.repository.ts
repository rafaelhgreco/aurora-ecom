import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  type QueryConstraint,
  query,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { ProductEntity } from "@/core/entities/product.entity";
import type { IProductRepository } from "@/core/repositories/product.repository.interface";
import type { ProductFilter } from "@/core/schemas/product.schema";
import { db } from "@/infrastructure/lib/firebase";

/**
 * Implementação do repositório de produtos usando Firebase Firestore
 */
export class FirestoreProductRepository implements IProductRepository {
  private collectionName = "products";

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
      title: data.title as string,
      subtitle: data.subtitle as string | undefined,
      description: data.description as string,
      price: data.price as number,
      imageUrl: data.imageUrl as string,
      images: (data.images as string[]) || [],
      category: data.category as string | undefined,
      stock: data.stock as number,
      sizes: data.sizes as
        | Array<"PP" | "P" | "M" | "G" | "GG" | "XG">
        | undefined,
      colors: data.colors as string[] | undefined,
      isActive: (data.isActive as boolean) ?? true,
      createdAt: toDate(data.createdAt),
      updatedAt: toDate(data.updatedAt),
      deletedAt: data.deletedAt ? toDate(data.deletedAt) : null,
    });
  }

  /**
   * Converte ProductEntity para documento Firestore
   */
  private entityToDoc(entity: ProductEntity): Record<string, unknown> {
    return {
      title: entity.title,
      subtitle: entity.subtitle,
      description: entity.description,
      price: entity.price,
      imageUrl: entity.imageUrl,
      images: entity.images,
      category: entity.category,
      stock: entity.stock,
      sizes: entity.sizes,
      colors: entity.colors,
      isActive: entity.isActive,
      createdAt: entity.createdAt
        ? Timestamp.fromDate(entity.createdAt)
        : Timestamp.now(),
      updatedAt: entity.updatedAt
        ? Timestamp.fromDate(entity.updatedAt)
        : Timestamp.now(),
      deletedAt: entity.deletedAt ? Timestamp.fromDate(entity.deletedAt) : null,
    };
  }

  async exists(id: string): Promise<boolean> {
    const docRef = doc(db, this.collectionName, id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  }

  async findAll(filters?: ProductFilter): Promise<ProductEntity[]> {
    const constraints: QueryConstraint[] = [];

    constraints.push(where("deletedAt", "==", null));

    if (filters?.category) {
      constraints.push(where("category", "==", filters.category));
    }

    if (filters?.isActive !== undefined) {
      constraints.push(where("isActive", "==", filters.isActive));
    }

    if (filters?.minPrice !== undefined) {
      constraints.push(where("price", ">=", filters.minPrice));
    }

    if (filters?.maxPrice !== undefined) {
      constraints.push(where("price", "<=", filters.maxPrice));
    }

    constraints.push(orderBy("createdAt", "desc"));

    const q = query(collection(db, this.collectionName), ...constraints);
    const snapshot = await getDocs(q);

    let results = snapshot.docs.map((doc) =>
      this.docToEntity(doc.id, doc.data()),
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

    return results;
  }

  async findById(id: string): Promise<ProductEntity | null> {
    const docRef = doc(db, this.collectionName, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();

    if (data.deletedAt) {
      return null;
    }

    return this.docToEntity(docSnap.id, data);
  }

  async create(product: ProductEntity): Promise<ProductEntity> {
    const docData = this.entityToDoc(product);
    const docRef = await addDoc(collection(db, this.collectionName), docData);

    return new ProductEntity({
      ...product,
      id: docRef.id,
    });
  }

  async update(
    id: string,
    product: Partial<ProductEntity>,
  ): Promise<ProductEntity> {
    const docRef = doc(db, this.collectionName, id);

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
    if (product.sizes !== undefined) updateData.sizes = product.sizes;
    if (product.colors !== undefined) updateData.colors = product.colors;
    if (product.isActive !== undefined) updateData.isActive = product.isActive;

    await updateDoc(docRef, updateData);

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error("Produto não encontrado após atualização");
    }

    return updated;
  }

  async delete(id: string): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await deleteDoc(docRef);
  }

  /**
   * Soft delete - marca como deletado sem remover do banco
   */
  async softDelete(id: string): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await updateDoc(docRef, {
      deletedAt: Timestamp.now(),
      isActive: false,
      updatedAt: Timestamp.now(),
    });
  }

  /**
   * Restaura um produto deletado
   */
  async restore(id: string): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await updateDoc(docRef, {
      deletedAt: null,
      updatedAt: Timestamp.now(),
    });
  }

  /**
   * Lista produtos deletados
   */
  async findDeleted(): Promise<ProductEntity[]> {
    const q = query(
      collection(db, this.collectionName),
      where("deletedAt", "!=", null),
      orderBy("deletedAt", "desc"),
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => this.docToEntity(doc.id, doc.data()));
  }
}
