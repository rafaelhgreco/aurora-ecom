import { cache } from "react";
import type { Product } from "@/core/schemas/product.schema";
import { GetProductByIdUseCase } from "@/core/use-cases/get-product-by-id.use-case";
import { GetProductBySlugUseCase } from "@/core/use-cases/get-product-by-slug.use-case";
import { FirestoreProductRepository } from "@/infrastructure/repositories/firestore-product.repository";
import { serializeProductForClient } from "@/shared/serialize-product";

const productRepository = new FirestoreProductRepository();

export type ResolvedProduct =
  | { kind: "found"; product: Product }
  | { kind: "redirect"; canonicalSlug: string }
  | { kind: "not-found" };

/**
 * Resolve o param da rota `/produto/[slug]` tentando o slug primeiro e, se
 * não encontrar, o ID do Firestore (link antigo `/produto/{id}`) — nesse
 * caso sinaliza redirect para a URL canônica. `status !== "ACTIVE"` é
 * tratado como não encontrado nos dois casos, para não vazar/redirecionar
 * produtos DRAFT via link direto por ID.
 */
export const resolveProductRoute = cache(
  async (param: string): Promise<ResolvedProduct> => {
    const bySlugUseCase = new GetProductBySlugUseCase(productRepository);
    const bySlug = await bySlugUseCase.execute(param).catch(() => null);
    if (bySlug && bySlug.status === "ACTIVE") {
      return { kind: "found", product: serializeProductForClient(bySlug) };
    }

    const byIdUseCase = new GetProductByIdUseCase(productRepository);
    const byId = await byIdUseCase.execute(param).catch(() => null);
    if (byId && byId.status === "ACTIVE") {
      if (byId.slug) {
        return { kind: "redirect", canonicalSlug: byId.slug };
      }
      return { kind: "found", product: serializeProductForClient(byId) };
    }

    return { kind: "not-found" };
  },
);
