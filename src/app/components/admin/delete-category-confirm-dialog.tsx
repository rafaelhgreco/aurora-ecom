/**
 * Componente: Delete Category Confirmation Dialog
 *
 * Modal de confirmação para deletar categoria
 */

"use client";

import {
  Button,
  type DialogOpenChangeDetails,
  Text,
  VStack,
} from "@chakra-ui/react";
import type { Category } from "@/app/types/category";
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

interface DeleteCategoryConfirmDialogProps {
  open: boolean;
  category: Category | null;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteCategoryConfirmDialog({
  open,
  category,
  isLoading = false,
  onConfirm,
  onCancel,
}: DeleteCategoryConfirmDialogProps) {
  const isOpen = Boolean(open && category);

  return (
    <DialogRoot
      id="admin-delete-category"
      open={isOpen}
      onOpenChange={(e: DialogOpenChangeDetails) => {
        if (!e.open) onCancel();
      }}
    >
      {category ? (
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>

          <DialogBody>
            <VStack align="stretch" gap={3}>
              <Text>Tem certeza que deseja deletar a categoria:</Text>
              <Text fontWeight="bold" fontSize="lg">
                {category.name}
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
      ) : null}
    </DialogRoot>
  );
}
