export function logServerError(
  scope: string,
  error: unknown,
  meta?: Record<string, unknown>,
): void {
  const payload: Record<string, unknown> = { scope, ...meta };

  if (error instanceof Error) {
    payload.message = error.message;
    payload.name = error.name;
    if (error.stack) payload.stack = error.stack;
    if ("cause" in error && error.cause !== undefined) {
      payload.cause = error.cause;
    }
  } else {
    payload.error = error;
  }

  console.error("[server-error]", payload);
}
