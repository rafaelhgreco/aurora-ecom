/**
 * Componente: Clear All Orders Confirmation Dialog
 *
 * Modal de confirmação para limpar (apagar) todos os pedidos do sistema.
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

interface ClearAllOrdersConfirmDialogProps {
  open: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ClearAllOrdersConfirmDialog({
  open,
  isLoading = false,
  onConfirm,
  onCancel,
}: ClearAllOrdersConfirmDialogProps) {
  return (
    <DialogRoot
      id="admin-clear-all-orders"
      open={open}
      onOpenChange={(e: DialogOpenChangeDetails) => {
        if (!e.open) onCancel();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Limpar todos os pedidos</DialogTitle>
          <DialogCloseTrigger />
        </DialogHeader>

        <DialogBody>
          <VStack align="stretch" gap={3}>
            <Text>
              Esta ação vai remover{" "}
              <strong>permanentemente todos os pedidos</strong> cadastrados no
              sistema.
            </Text>
            <Text fontSize="sm" color="gray.600">
              Uma planilha com todos os pedidos será baixada automaticamente
              antes da exclusão, para fins de auditoria.
            </Text>
            <Text fontWeight="bold" color="red.500" fontSize="sm">
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
            Limpar tudo
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
}
