import { logServerError } from "@/shared/errors/log-server-error";
import {
  type ClientErrorResult,
  type ErrorContext,
  mapToClientError,
} from "@/shared/errors/map-to-client-error";

export function handleActionError(
  scope: string,
  error: unknown,
  context: ErrorContext,
  meta?: Record<string, unknown>,
): ClientErrorResult {
  logServerError(scope, error, meta);
  return mapToClientError(error, context);
}
