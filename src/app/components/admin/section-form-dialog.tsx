"use client";
"use no memo";

/**
 * Componente: Section Form Dialog
 *
 * Modal de criação/edição de seção do catálogo (nome, URL, descrição).
 */

import {
  Button,
  type DialogOpenChangeDetails,
  Input,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
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
import { createSectionSchema } from "@/core/schemas/section.schema";
import { slugify } from "@/shared/slugify";

interface SectionFormValues {
  name: string;
  slug: string;
  description?: string;
}

interface SectionFormDialogProps {
  open: boolean;
  section: Section | null;
  isLoading?: boolean;
  onSubmit: (data: SectionFormValues) => void;
  onCancel: () => void;
}

export function SectionFormDialog({
  open,
  section,
  isLoading = false,
  onSubmit,
  onCancel,
}: SectionFormDialogProps) {
  const isEdit = !!section;
  const slugTouchedRef = useRef(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<SectionFormValues>({
    // biome-ignore lint/suspicious/noExplicitAny: zodResolver type compatibility
    resolver: zodResolver(createSectionSchema) as any,
    defaultValues: {
      name: section?.name ?? "",
      slug: section?.slug ?? "",
      description: section?.description ?? "",
    },
  });

  useEffect(() => {
    reset({
      name: section?.name ?? "",
      slug: section?.slug ?? "",
      description: section?.description ?? "",
    });
    slugTouchedRef.current = false;
  }, [section, reset]);

  const nameValue = watch("name");

  useEffect(() => {
    if (isEdit || slugTouchedRef.current) return;
    setValue("slug", slugify(nameValue || ""), { shouldValidate: false });
  }, [nameValue, isEdit, setValue]);

  const submit = (data: SectionFormValues) => onSubmit(data);

  return (
    <DialogRoot
      id="admin-section-form"
      open={open}
      size={{ base: "full", md: "md" }}
      onOpenChange={(e: DialogOpenChangeDetails) => {
        if (!e.open) onCancel();
      }}
    >
      <DialogContent>
        <form onSubmit={handleSubmit(submit)} noValidate>
          <DialogHeader>
            <DialogTitle>{isEdit ? "Editar Seção" : "Nova Seção"}</DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>

          <DialogBody>
            <VStack align="stretch" gap={3}>
              <Field
                label="Nome"
                required
                helperText="Ex: Roupas (2 a 50 caracteres)"
                invalid={!!errors.name}
                errorText={errors.name?.message}
              >
                <Input
                  {...register("name")}
                  placeholder="Ex: Roupas"
                  autoFocus
                />
              </Field>

              <Field
                label="URL"
                required
                helperText="Usada em /loja/sua-url"
                invalid={!!errors.slug}
                errorText={errors.slug?.message}
              >
                <Input
                  {...register("slug", {
                    onChange: () => {
                      slugTouchedRef.current = true;
                    },
                  })}
                  placeholder="Ex: roupas"
                />
              </Field>

              <Field
                label="Descrição"
                optionalText="(opcional)"
                helperText="Até 200 caracteres"
                invalid={!!errors.description}
                errorText={errors.description?.message}
              >
                <Textarea
                  {...register("description")}
                  placeholder="Peças e coleções de vestuário."
                  rows={3}
                />
              </Field>
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
