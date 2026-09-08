import type { Section } from "@/core/schemas/section.schema";

export function serializeSectionForClient(s: Section): Section {
  return {
    ...s,
    createdAt: s.createdAt
      ? new Date(s.createdAt as Date | string).toISOString()
      : undefined,
    updatedAt: s.updatedAt
      ? new Date(s.updatedAt as Date | string).toISOString()
      : undefined,
  } as Section;
}
