/**
 * Componente: Delete Confirmation Dialog
 *
 * Modal de confirmação para deletar produto
 */

"use client";

import { Button, Text, VStack } from "@chakra-ui/react";
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

interface DeleteConfirmDialogProps {
  open: boolean;
  product: Product | null;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmDialog({
  open,
  product,
  isLoading = false,
  onConfirm,
  onCancel,
}: DeleteConfirmDialogProps) {
  if (!product) return null;

  return (
    <DialogRoot
      open={open}
      onOpenChange={(e: { open: boolean }) => !e.open && onCancel()}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar Exclusão</DialogTitle>
          <DialogCloseTrigger />
        </DialogHeader>

        <DialogBody>
          <VStack align="stretch" gap={3}>
            <Text>Tem certeza que deseja deletar o produto:</Text>
            <Text fontWeight="bold" fontSize="lg">
              {product.title}
            </Text>
            <Text color="red.500" fontSize="sm">
              Esta ação não pode ser desfeita.
            </Text>
          </VStack>
        </DialogBody>

        <DialogFooter>
          <DialogActionTrigger asChild>
            <Button variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancelar
            </Button>
          </DialogActionTrigger>
          <Button colorScheme="red" onClick={onConfirm} loading={isLoading}>
            Deletar
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
}
