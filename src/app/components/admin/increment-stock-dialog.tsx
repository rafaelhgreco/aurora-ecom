"use client";

import {
  Button,
  type DialogOpenChangeDetails,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";

interface IncrementStockDialogProps {
  open: boolean;
  barcode: string;
  currentStock: number;
  isLoading?: boolean;
  onConfirm: (quantity: number) => void;
  onCancel: () => void;
}

export function IncrementStockDialog({
  open,
  barcode,
  currentStock,
  isLoading = false,
  onConfirm,
  onCancel,
}: IncrementStockDialogProps) {
  const [addOne, setAddOne] = useState(true);
  const [customQuantity, setCustomQuantity] = useState("1");

  useEffect(() => {
    if (open) {
      setAddOne(true);
      setCustomQuantity("1");
    }
  }, [open]);

  const quantity = addOne ? 1 : Math.max(1, Number(customQuantity) || 1);

  return (
    <DialogRoot
      id="increment-stock-dialog"
      open={open}
      onOpenChange={(e: DialogOpenChangeDetails) => {
        if (!e.open) onCancel();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Produto já cadastrado</DialogTitle>
          <DialogCloseTrigger />
        </DialogHeader>

        <DialogBody>
          <VStack align="stretch" gap={4}>
            <Text>
              O código <strong>{barcode}</strong> já está cadastrado (estoque
              atual: <strong>{currentStock}</strong>). Deseja adicionar mais
              unidades?
            </Text>

            <Checkbox
              checked={addOne}
              onCheckedChange={(e) => setAddOne(e.checked === true)}
            >
              Adicionar +1 produto
            </Checkbox>

            {!addOne && (
              <Field label="Quantidade a adicionar">
                <Input
                  type="number"
                  min={1}
                  value={customQuantity}
                  onChange={(e) => setCustomQuantity(e.target.value)}
                  autoFocus
                />
              </Field>
            )}
          </VStack>
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            colorScheme="blue"
            onClick={() => onConfirm(quantity)}
            loading={isLoading}
          >
            Adicionar {quantity}
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
}
