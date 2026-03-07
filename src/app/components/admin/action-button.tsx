/**
 * Componente: Botão de Ação
 *
 * Botão reutilizável com estados de loading
 */

"use client";

import { Button, type ButtonProps } from "@chakra-ui/react";
import { useState } from "react";

interface ActionButtonProps extends Omit<ButtonProps, "onClick"> {
  onAction: () => Promise<void> | void;
  loadingText?: string;
  confirmMessage?: string;
}

export function ActionButton({
  onAction,
  loadingText = "Processando...",
  confirmMessage,
  children,
  ...props
}: ActionButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (confirmMessage && !window.confirm(confirmMessage)) {
      return;
    }

    setIsLoading(true);
    try {
      await onAction();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleClick} loading={isLoading} {...props}>
      {isLoading ? loadingText : children}
    </Button>
  );
}
