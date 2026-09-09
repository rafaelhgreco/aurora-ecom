/**
 * Converte os campos `createdAt`/`updatedAt` (Date opcional) de uma entidade
 * de domínio para string ISO — formato devolvido ao cliente pelas Server
 * Actions (`SerializedProduct`, `SerializedCategory`, `SerializedSection`).
 */
export function serializeTimestamps<
  T extends { createdAt?: Date; updatedAt?: Date },
>(
  entity: T,
): Omit<T, "createdAt" | "updatedAt"> & {
  createdAt?: string;
  updatedAt?: string;
} {
  return {
    ...entity,
    createdAt: entity.createdAt?.toISOString(),
    updatedAt: entity.updatedAt?.toISOString(),
  };
}
