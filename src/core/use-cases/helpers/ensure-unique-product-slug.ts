import type { IProductRepository } from "@/core/repositories/product.repository.interface";

/**
 * Gera um slug único a partir de `desiredSlug`, tentando sufixos `-2`, `-3`, ...
 * até encontrar um valor livre. Usado apenas em geração silenciosa (sem
 * usuário para reagir a um conflito) — import em massa e migração/backfill.
 */
export async function ensureUniqueProductSlug(
  repo: IProductRepository,
  desiredSlug: string,
  excludeId?: string,
): Promise<string> {
  let candidate = desiredSlug;
  let suffix = 2;

  while (true) {
    const existing = await repo.findBySlug(candidate);
    if (!existing || existing.id === excludeId) {
      return candidate;
    }
    candidate = `${desiredSlug}-${suffix}`;
    suffix += 1;
  }
}
