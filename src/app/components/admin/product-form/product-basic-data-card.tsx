"use no memo";
import {
  Box,
  Card,
  Heading,
  HStack,
  Input,
  Stack,
  Textarea,
} from "@chakra-ui/react";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { IoDocumentTextOutline } from "react-icons/io5";
import { Field } from "@/components/ui/field";
import {
  SHOP_CATEGORY_IDS,
  SHOP_CATEGORY_LABELS,
} from "@/core/catalog/shop-catalog";
import type { ProductFormValues } from "@/core/schemas/product.schema";

interface ProductBasicDataCardProps {
  register: UseFormRegister<ProductFormValues>;
  errors: FieldErrors<ProductFormValues>;
  isEdit?: boolean;
  descriptionValue?: string;
  onSlugTouched?: () => void;
  onSlugBlurSanitize?: (rawValue: string) => void;
}

export function ProductBasicDataCard({
  register,
  errors,
  isEdit,
  descriptionValue,
  onSlugTouched,
  onSlugBlurSanitize,
}: ProductBasicDataCardProps) {
  const descriptionLength = descriptionValue?.length ?? 0;

  return (
    <Card.Root>
      <Card.Header>
        <HStack gap={2}>
          <IoDocumentTextOutline />
          <Heading size="lg">Dados Básicos</Heading>
        </HStack>
      </Card.Header>
      <Card.Body>
        <Stack gap={4}>
          <Field
            label="Título"
            required
            helperText="3 a 100 caracteres"
            invalid={!!errors.title}
            errorText={errors.title?.message}
          >
            <Input {...register("title")} placeholder="Ex: Camiseta Básica" />
          </Field>

          <Field
            label="URL personalizada"
            required
            helperText="Usada em /produto/sua-url. Sugerida a partir do título, mas você pode editar."
            invalid={!!errors.slug}
            errorText={errors.slug?.message}
          >
            <Input
              {...register("slug", {
                onChange: () => onSlugTouched?.(),
                onBlur: (e) => onSlugBlurSanitize?.(e.target.value),
              })}
              placeholder="Ex: camiseta-basica"
            />
          </Field>

          <Field
            label="Subtítulo"
            optionalText="(opcional)"
            helperText="Até 200 caracteres"
            invalid={!!errors.subtitle}
            errorText={errors.subtitle?.message}
          >
            <Input {...register("subtitle")} placeholder="Ex: 100% Algodão" />
          </Field>

          <Field
            label="Descrição"
            required
            helperText={`${descriptionLength}/5000 caracteres (mínimo 10)`}
            invalid={!!errors.description}
            errorText={errors.description?.message}
          >
            <Textarea
              {...register("description")}
              placeholder="Descreva o produto..."
              rows={4}
            />
          </Field>

          <Field
            label="Categoria"
            optionalText="(opcional)"
            helperText="Nome livre, ex: Camisetas (mín. 2 caracteres se preenchido)"
            invalid={!!errors.category}
            errorText={errors.category?.message}
          >
            <Input {...register("category")} placeholder="Ex: Camisetas" />
          </Field>

          <Field
            label="Seção do catálogo (loja)"
            helperText="Define em qual página /loja/... o produto aparece."
            invalid={!!errors.shopCategory}
            errorText={errors.shopCategory?.message}
          >
            <Box
              as="select"
              borderWidth="1px"
              borderRadius="md"
              px={3}
              py={2}
              w="full"
              bg="white"
              {...register("shopCategory")}
            >
              {SHOP_CATEGORY_IDS.map((id) => (
                <option key={id} value={id}>
                  {SHOP_CATEGORY_LABELS[id]}
                </option>
              ))}
            </Box>
          </Field>

          {isEdit && (
            <Field
              label="Status"
              helperText="Rascunho: produto ainda não enriquecido. Publicado: visível na loja."
              invalid={!!errors.status}
              errorText={errors.status?.message}
            >
              <Box
                as="select"
                borderWidth="1px"
                borderRadius="md"
                px={3}
                py={2}
                w="full"
                bg="white"
                {...register("status")}
              >
                <option value="DRAFT">Rascunho</option>
                <option value="ACTIVE">Publicado</option>
              </Box>
            </Field>
          )}
        </Stack>
      </Card.Body>
    </Card.Root>
  );
}
