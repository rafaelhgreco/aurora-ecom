import { ZodError, type ZodType } from "zod";
import { ValidationError } from "@/shared/errors/domain-errors";

/**
 * `schema.parse(input)`, convertendo `ZodError` em `ValidationError` (formato
 * que as Server Actions usam para devolver erro por campo ao formulário).
 * Qualquer outro erro lançado durante o parse propaga sem alteração.
 */
export function parseOrThrow<T>(
  schema: ZodType<T>,
  input: unknown,
  message: string,
): T {
  try {
    return schema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ValidationError(
        message,
        error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      );
    }
    throw error;
  }
}
