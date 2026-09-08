/**
 * Componente: Delete Section Confirmation Dialog
 *
 * Modal de confirmação para deletar seção
 */

"use client";

import {
  Button,
  type DialogOpenChangeDetails,
  Text,
  VStack,
} from "@chakra-ui/react";
import type { Section } from "@/app/types/section";
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

interface DeleteSectionConfirmDialogProps {
  open: boolean;
  section: Section | null;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteSectionConfirmDialog({
  open,
  section,
  isLoading = false,
  onConfirm,
  onCancel,
}: DeleteSectionConfirmDialogProps) {
  const isOpen = Boolean(open && section);

  return (
    <DialogRoot
      id="admin-delete-section"
      open={isOpen}
      onOpenChange={(e: DialogOpenChangeDetails) => {
        if (!e.open) onCancel();
      }}
    >
      {section ? (
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>

          <DialogBody>
            <VStack align="stretch" gap={3}>
              <Text>Tem certeza que deseja deletar a seção:</Text>
              <Text fontWeight="bold" fontSize="lg">
                {section.name}
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
