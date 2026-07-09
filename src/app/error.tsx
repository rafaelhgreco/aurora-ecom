"use client";

import { ErrorState } from "@/app/components/states/error-state";
import { PUBLIC_GENERIC } from "@/shared/errors/client-error-messages";

export default function AppErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      message={PUBLIC_GENERIC}
      onRetry={reset}
      backUrl="/loja"
      backText="Ir para a loja"
    />
  );
}
