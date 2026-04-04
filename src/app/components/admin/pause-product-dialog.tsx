/**
 * Confirmação ao pausar produto na vitrine (zera estoque).
 */

"use client";

import {
  Button,
  type DialogOpenChangeDetails,
  Text,
  VStack,
} from "@chakra-ui/react";
import type { Product } from "@/app/types/product";
import {
  DialogActionTrigger,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from "@/components/ui/dialog";

export interface PauseProductDialogProps {
  product: Product | null;
  isLoading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function PauseProductDialog({
  product,
  isLoading,
  onCancel,
  onConfirm,
}: PauseProductDialogProps) {
  const open = Boolean(product);

  return (
    <DialogRoot
      id="admin-pause-product"
      open={open}
      onOpenChange={(e: DialogOpenChangeDetails) => {
        if (!e.open) onCancel();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pausar produto na vitrine</DialogTitle>
          <DialogCloseTrigger />
        </DialogHeader>
        <DialogBody>
          <VStack align="stretch" gap={3}>
            {product && (
              <>
                <Text>
                  <strong>{product.title}</strong>
                </Text>
                <Text color="orange.600" fontWeight="medium">
                  Todos os itens do estoque atual serão removidos.
                </Text>
                <Text fontSize="sm" color="gray.600">
                  O produto continuará na loja como esgotado. Para reativar,
                  clique em &quot;Reativar&quot; e cadastre o estoque novamente.
                </Text>
              </>
            )}
          </VStack>
        </DialogBody>
        <DialogFooter>
          <DialogActionTrigger asChild>
            <Button variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancelar
            </Button>
          </DialogActionTrigger>
          <Button colorScheme="orange" loading={isLoading} onClick={onConfirm}>
            Pausar e zerar estoque
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
}
