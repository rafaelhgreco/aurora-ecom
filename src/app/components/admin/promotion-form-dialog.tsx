"use client";
"use no memo";

/**
 * Componente: Promotion Form Dialog
 *
 * Modal de criação/edição de promoção (nome + percentual de desconto + ativa).
 */

import {
  Button,
  type DialogOpenChangeDetails,
  Input,
  VStack,
} from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import type { z } from "zod";
import type { Promotion } from "@/app/types/promotion";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Field } from "@/components/ui/field";
import { createPromotionSchema } from "@/core/schemas/promotion.schema";

/** Input do formulário (pré-parse): `active` tem `.default()` no schema, por isso é opcional aqui. */
type PromotionFormValues = z.input<typeof createPromotionSchema>;

interface PromotionFormDialogProps {
  open: boolean;
  promotion: Promotion | null;
  isLoading?: boolean;
  onSubmit: (data: {
    name: string;
    discountPercentage: number;
    active: boolean;
  }) => void;
  onCancel: () => void;
}

export function PromotionFormDialog({
  open,
  promotion,
  isLoading = false,
  onSubmit,
  onCancel,
}: PromotionFormDialogProps) {
  const isEdit = !!promotion;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<PromotionFormValues>({
    resolver: zodResolver(createPromotionSchema),
    defaultValues: {
      name: promotion?.name ?? "",
      discountPercentage: promotion?.discountPercentage ?? 0,
      active: promotion?.active ?? true,
    },
  });

  useEffect(() => {
    reset({
      name: promotion?.name ?? "",
      discountPercentage: promotion?.discountPercentage ?? 0,
      active: promotion?.active ?? true,
    });
  }, [promotion, reset]);

  const submit = (data: PromotionFormValues) =>
    onSubmit({
      name: data.name,
      discountPercentage: data.discountPercentage,
      active: data.active ?? true,
    });

  return (
    <DialogRoot
      id="admin-promotion-form"
      open={open}
      size={{ base: "full", md: "md" }}
      onOpenChange={(e: DialogOpenChangeDetails) => {
        if (!e.open) onCancel();
      }}
    >
      <DialogContent>
        <form onSubmit={handleSubmit(submit)} noValidate>
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "Editar Promoção" : "Nova Promoção"}
            </DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>

          <DialogBody>
            <VStack align="stretch" gap={3}>
              <Field
                label="Nome"
                required
                helperText="Ex: Black Friday (2 a 50 caracteres)"
                invalid={!!errors.name}
                errorText={errors.name?.message}
              >
                <Input
                  {...register("name")}
                  placeholder="Ex: Black Friday"
                  autoFocus
                />
              </Field>

              <Field
                label="Percentual de desconto"
                required
                helperText="Aplicado sobre o preço de cada produto associado (ou sobre o valor base definido para ele, quando houver)"
                invalid={!!errors.discountPercentage}
                errorText={errors.discountPercentage?.message}
              >
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  max={100}
                  {...register("discountPercentage", { valueAsNumber: true })}
                  placeholder="Ex: 20"
                />
              </Field>

              <Controller
                name="active"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    checked={field.value ?? true}
                    onCheckedChange={(details) =>
                      field.onChange(details.checked === true)
                    }
                  >
                    Promoção ativa
                  </Checkbox>
                )}
              />
            </VStack>
          </DialogBody>

          <DialogFooter>
            <DialogActionTrigger asChild>
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancelar
              </Button>
            </DialogActionTrigger>
            <Button type="submit" colorScheme="blue" loading={isLoading}>
              {isEdit ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </DialogRoot>
  );
}
