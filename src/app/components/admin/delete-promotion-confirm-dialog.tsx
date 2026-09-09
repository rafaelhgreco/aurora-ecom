/**
 * Componente: Delete Promotion Confirmation Dialog
 *
 * Modal de confirmação para deletar promoção
 */

"use client";

import {
  Button,
  type DialogOpenChangeDetails,
  Text,
  VStack,
} from "@chakra-ui/react";
import type { Promotion } from "@/app/types/promotion";
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

interface DeletePromotionConfirmDialogProps {
  open: boolean;
  promotion: Promotion | null;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeletePromotionConfirmDialog({
  open,
  promotion,
  isLoading = false,
  onConfirm,
  onCancel,
}: DeletePromotionConfirmDialogProps) {
  const isOpen = Boolean(open && promotion);

  return (
    <DialogRoot
      id="admin-delete-promotion"
      open={isOpen}
      onOpenChange={(e: DialogOpenChangeDetails) => {
        if (!e.open) onCancel();
      }}
    >
      {promotion ? (
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>

          <DialogBody>
            <VStack align="stretch" gap={3}>
              <Text>Tem certeza que deseja deletar a promoção:</Text>
              <Text fontWeight="bold" fontSize="lg">
                {promotion.name}
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
