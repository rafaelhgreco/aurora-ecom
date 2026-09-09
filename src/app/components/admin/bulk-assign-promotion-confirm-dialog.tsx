/**
 * Componente: Bulk Assign Promotion Confirm Dialog
 *
 * Modal de confirmação para associar/remover em massa a promoção de vários
 * produtos (mirror de `BulkMoveCategoryConfirmDialog`).
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

interface BulkAssignPromotionConfirmDialogProps {
  open: boolean;
  count: number;
  promotionName: string;
  isRemove: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function BulkAssignPromotionConfirmDialog({
  open,
  count,
  promotionName,
  isRemove,
  isLoading = false,
  onConfirm,
  onCancel,
}: BulkAssignPromotionConfirmDialogProps) {
  return (
    <DialogRoot
      id="admin-bulk-assign-promotion"
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
            {isRemove ? (
              <Text>
                Remover{" "}
                <strong>
                  {count} produto{count > 1 ? "s" : ""}
                </strong>{" "}
                da promoção <strong>&ldquo;{promotionName}&rdquo;</strong>?
              </Text>
            ) : (
              <Text>
                Associar{" "}
                <strong>
                  {count} produto{count > 1 ? "s" : ""}
                </strong>{" "}
                à promoção <strong>&ldquo;{promotionName}&rdquo;</strong>?
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
