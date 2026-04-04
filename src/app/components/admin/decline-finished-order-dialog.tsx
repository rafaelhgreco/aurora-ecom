/**
 * Confirmação ao alterar pedido finalizado para Declinada (devolve estoque).
 */

"use client";

import {
  Button,
  type DialogOpenChangeDetails,
  Text,
  VStack,
} from "@chakra-ui/react";
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

export interface DeclineFinishedOrderDialogProps {
  orderId: string | null;
  isConfirmLoading: boolean;
  /** Bloqueia Cancelar enquanto há atualização em andamento (qualquer pedido). */
  cancelDisabled?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeclineFinishedOrderDialog({
  orderId,
  isConfirmLoading,
  cancelDisabled = false,
  onCancel,
  onConfirm,
}: DeclineFinishedOrderDialogProps) {
  const open = Boolean(orderId);

  return (
    <DialogRoot
      id="admin-decline-finished-order"
      open={open}
      onOpenChange={(e: DialogOpenChangeDetails) => {
        if (!e.open) onCancel();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Alterar status para Declinada</DialogTitle>
          <DialogCloseTrigger />
        </DialogHeader>
        <DialogBody>
          <VStack align="stretch" gap={3}>
            <Text>
              Ao alterar o status de um pedido finalizado, os itens voltam ao
              estoque automaticamente.
            </Text>
            <Text fontWeight="medium" color="orange.600">
              Os itens do estoque devem ser recontados para conferência.
            </Text>
            <Text fontSize="sm" color="gray.600">
              Use esta opção apenas em caso de erro humano (ex.: finalizou um
              pedido por engano).
            </Text>
          </VStack>
        </DialogBody>
        <DialogFooter>
          <DialogActionTrigger asChild>
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={cancelDisabled || isConfirmLoading}
            >
              Cancelar
            </Button>
          </DialogActionTrigger>
          <Button
            colorScheme="red"
            loading={isConfirmLoading}
            onClick={onConfirm}
          >
            Confirmar e devolver estoque
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
}
