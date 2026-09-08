"use client";
import { IconButton } from "@chakra-ui/react";
import { FiShare2 } from "react-icons/fi";
import { toaster } from "@/components/ui/toaster";

interface ShareProductButtonProps {
  title: string;
  text?: string;
}

/**
 * Compartilha o link da página atual: abre a folha nativa de compartilhamento
 * (Web Share API) quando disponível, com fallback para copiar o link.
 */
export function ShareProductButton({ title, text }: ShareProductButtonProps) {
  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toaster.create({
        title: "Link copiado!",
        description: "Cole onde quiser compartilhar.",
        type: "success",
        closable: true,
        duration: 4000,
      });
    } catch {
      toaster.create({
        title: "Não foi possível copiar o link",
        type: "error",
        closable: true,
        duration: 4000,
      });
    }
  };

  const handleShare = async () => {
    const url = window.location.href;

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return; // usuário cancelou a folha de compartilhamento, não é erro
        }
        // falha real do Web Share API: cai para o fallback de clipboard
      }
    }

    await copyToClipboard(url);
  };

  return (
    <IconButton
      aria-label="Compartilhar produto"
      title="Compartilhar"
      variant="ghost"
      onClick={handleShare}
    >
      <FiShare2 />
    </IconButton>
  );
}
