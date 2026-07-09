import {
  ADMIN_GENERIC,
  CHECKOUT_GENERIC,
  PUBLIC_GENERIC,
} from "@/shared/errors/client-error-messages";
import {
  DomainError,
  InsufficientStockError,
  NotFoundError,
  ValidationError,
} from "@/shared/errors/domain-errors";
import { InternalError } from "@/shared/errors/internal-error";

export type ErrorContext = "public" | "admin" | "checkout";

export type ClientErrorResult = {
  message: string;
  details?: Array<{ field: string; message: string }>;
};

const INFRA_PATTERNS = [
  /firebase/i,
  /firestore/i,
  /cloudinary/i,
  /grpc/i,
  /permission_denied/i,
  /not_found:/i,
  /unavailable/i,
  /internal error/i,
  /network/i,
  /timeout/i,
  /\.ts:\d+/i,
  /\/home\//i,
  /\/src\//i,
  /firebase admin/i,
];

function genericForContext(context: ErrorContext): string {
  switch (context) {
    case "admin":
      return ADMIN_GENERIC;
    case "checkout":
      return CHECKOUT_GENERIC;
    default:
      return PUBLIC_GENERIC;
  }
}

function looksLikeInfraMessage(message: string): boolean {
  return INFRA_PATTERNS.some((pattern) => pattern.test(message));
}

function isCheckoutBusinessError(message: string): boolean {
  return (
    /não está disponível/i.test(message) ||
    /estoque insuficiente/i.test(message) ||
    /produto ".+" não encontrado/i.test(message) ||
    /^produto .+ não encontrado$/i.test(message)
  );
}

function isAdminBusinessError(message: string): boolean {
  return (
    /estoque insuficiente/i.test(message) ||
    /cor ".+" não encontrada/i.test(message) ||
    /pedido não encontrado/i.test(message) ||
    /produto não encontrado/i.test(message) ||
    /dados inválidos/i.test(message) ||
    /recurso indisponível/i.test(message)
  );
}

function isSafeBusinessMessage(
  message: string,
  context: ErrorContext,
): boolean {
  if (context === "checkout") {
    return isCheckoutBusinessError(message);
  }
  if (context === "admin") {
    return isAdminBusinessError(message);
  }
  return /não encontrado/i.test(message) && !looksLikeInfraMessage(message);
}

export function mapToClientError(
  error: unknown,
  context: ErrorContext,
): ClientErrorResult {
  if (error instanceof ValidationError) {
    if (context === "admin") {
      return {
        message: error.message,
        details: error.errors,
      };
    }
    return { message: genericForContext(context) };
  }

  if (error instanceof NotFoundError) {
    return { message: error.message };
  }

  if (error instanceof InsufficientStockError) {
    if (context === "checkout" || context === "admin") {
      return { message: error.message };
    }
    return { message: genericForContext(context) };
  }

  if (error instanceof DomainError) {
    return { message: error.message };
  }

  if (error instanceof InternalError) {
    return { message: genericForContext(context) };
  }

  if (error instanceof Error) {
    if (isSafeBusinessMessage(error.message, context)) {
      return { message: error.message };
    }
    if (looksLikeInfraMessage(error.message)) {
      return { message: genericForContext(context) };
    }
    if (context === "checkout" || context === "admin") {
      return { message: error.message };
    }
    return { message: genericForContext(context) };
  }

  return { message: genericForContext(context) };
}
