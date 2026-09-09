/**
 * Componente: Bulk Move Category Confirm Dialog
 *
 * Modal de confirmação para mover/limpar em massa a subcategoria de vários
 * produtos.
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

interface BulkMoveCategoryConfirmDialogProps {
  open: boolean;
  count: number;
  /** Nome da subcategoria de destino, ou "Nenhuma" quando limpando */
  destinationLabel: string;
  isClear: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function BulkMoveCategoryConfirmDialog({
  open,
  count,
  destinationLabel,
  isClear,
  isLoading = false,
  onConfirm,
  onCancel,
}: BulkMoveCategoryConfirmDialogProps) {
  return (
    <DialogRoot
      id="admin-bulk-move-category"
      open={open}
      onOpenChange={(e: DialogOpenChangeDetails) => {
        if (!e.open) onCancel();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar ação</DialogTitle>
          <DialogCloseTrigger />
        </DialogHeader>

        <DialogBody>
          <VStack align="stretch" gap={3}>
            {isClear ? (
              <Text>
                Remover a subcategoria de{" "}
                <strong>
                  {count} produto{count > 1 ? "s" : ""}
                </strong>
                ?
              </Text>
            ) : (
              <Text>
                Mover{" "}
                <strong>
                  {count} produto{count > 1 ? "s" : ""}
                </strong>{" "}
                para <strong>&ldquo;{destinationLabel}&rdquo;</strong>?
              </Text>
            )}
          </VStack>
        </DialogBody>

        <DialogFooter>
          <DialogActionTrigger asChild>
            <Button variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancelar
            </Button>
          </DialogActionTrigger>
          <Button colorScheme="blue" onClick={onConfirm} loading={isLoading}>
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
}
