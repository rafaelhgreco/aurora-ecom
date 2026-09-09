"use client";
"use no memo";

/**
 * Componente: Category Form Dialog
 *
 * Modal de criação/edição de subcategoria (nome + seção pai).
 */

import {
  Box,
  Button,
  type DialogOpenChangeDetails,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import type { Category } from "@/app/types/category";
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
import { Field } from "@/components/ui/field";
import { createCategorySchema } from "@/core/schemas/category.schema";

interface CategoryFormValues {
  sectionId: string;
  name: string;
}

interface CategoryFormDialogProps {
  open: boolean;
  category: Category | null;
  sections: Section[];
  /** Seção pré-selecionada ao criar uma subcategoria a partir do bloco de uma seção. */
  defaultSectionId?: string;
  isLoading?: boolean;
  onSubmit: (data: { sectionId: string; name: string }) => void;
  onCancel: () => void;
}

export function CategoryFormDialog({
  open,
  category,
  sections,
  defaultSectionId,
  isLoading = false,
  onSubmit,
  onCancel,
}: CategoryFormDialogProps) {
  const isEdit = !!category;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CategoryFormValues>({
    // biome-ignore lint/suspicious/noExplicitAny: zodResolver type compatibility
    resolver: zodResolver(createCategorySchema) as any,
    defaultValues: {
      sectionId:
        category?.sectionId ?? defaultSectionId ?? sections[0]?.id ?? "",
      name: category?.name ?? "",
    },
  });

  useEffect(() => {
    reset({
      sectionId:
        category?.sectionId ?? defaultSectionId ?? sections[0]?.id ?? "",
      name: category?.name ?? "",
    });
  }, [category, defaultSectionId, sections, reset]);

  const submit = (data: CategoryFormValues) => onSubmit(data);

  return (
    <DialogRoot
      id="admin-category-form"
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
              {isEdit ? "Editar Subcategoria" : "Nova Subcategoria"}
            </DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>

          <DialogBody>
            <VStack align="stretch" gap={3}>
              <Field
                label="Seção"
                required
                invalid={!!errors.sectionId}
                errorText={errors.sectionId?.message}
              >
                <Box
                  as="select"
                  borderWidth="1px"
                  borderRadius="md"
                  px={3}
                  py={2}
                  w="full"
                  bg="white"
                  {...register("sectionId")}
                >
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Box>
              </Field>

              <Field
                label="Nome"
                required
                helperText="Ex: Camisetas (2 a 50 caracteres)"
                invalid={!!errors.name}
                errorText={errors.name?.message}
              >
                <Input
                  {...register("name")}
                  placeholder="Ex: Camisetas"
                  autoFocus
                />
              </Field>
              {isEdit && (
                <Text fontSize="sm" color="gray.500">
                  Renomear ou trocar a seção não atualiza produtos já
                  cadastrados com os valores anteriores.
                </Text>
              )}
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
