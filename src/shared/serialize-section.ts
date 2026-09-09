import type { Section, SerializedSection } from "@/core/schemas/section.schema";
import { serializeTimestamps } from "@/shared/serialize-timestamps";

export function serializeSectionForClient(section: Section): SerializedSection {
  return serializeTimestamps(section);
}
