"use no memo";
import {
  Box,
  Card,
  createListCollection,
  Heading,
  HStack,
  Input,
  Link,
  Portal,
  SelectContent,
  SelectItem,
  SelectPositioner,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
  Stack,
  Textarea,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useMemo } from "react";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { IoDocumentTextOutline } from "react-icons/io5";
import type { Category } from "@/app/types/category";
import type { Section } from "@/app/types/section";
import { Field } from "@/components/ui/field";
import type { ProductFormValues } from "@/core/schemas/product.schema";

const NO_CATEGORY_VALUE = "";

interface ProductBasicDataCardProps {
  register: UseFormRegister<ProductFormValues>;
  errors: FieldErrors<ProductFormValues>;
  isEdit?: boolean;
  descriptionValue?: string;
  sections: Section[];
  shopCategoryValue?: string;
  onShopCategoryChange: (value: string) => void;
  categories: Category[];
  categoryValue?: string;
  onCategoryChange: (value: string) => void;
  onSlugTouched?: () => void;
  onSlugBlurSanitize?: (rawValue: string) => void;
}

export function ProductBasicDataCard({
  register,
  errors,
  isEdit,
  descriptionValue,
  sections,
  shopCategoryValue,
  onShopCategoryChange,
  categories,
  categoryValue,
  onCategoryChange,
  onSlugTouched,
  onSlugBlurSanitize,
}: ProductBasicDataCardProps) {
  const descriptionLength = descriptionValue?.length ?? 0;

  const sectionCollection = useMemo(
    () =>
      createListCollection({
        items: sections.map((s) => ({ label: s.name, value: s.id ?? "" })),
      }),
    [sections],
  );

  /** Subcategoria só mostra opções da seção selecionada (stacking Seção + Subcategoria). */
  const categoriesInSection = useMemo(
    () => categories.filter((c) => c.sectionId === shopCategoryValue),
    [categories, shopCategoryValue],
  );

  const categoryCollection = useMemo(
    () =>
      createListCollection({
        items: [
          { label: "Nenhuma", value: NO_CATEGORY_VALUE },
          ...categoriesInSection.map((c) => ({
            label: c.name,
            value: c.name,
          })),
        ],
      }),
    [categoriesInSection],
  );

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
            label="Seção do catálogo (loja)"
            helperText={
              <>
                Define em qual página /loja/... o produto aparece. Não achou a
                seção certa?{" "}
                <Link asChild color="blue.500">
                  <NextLink href="/admin-categorias" target="_blank">
                    Cadastre aqui.
                  </NextLink>
                </Link>
              </>
            }
            invalid={!!errors.shopCategory}
            errorText={errors.shopCategory?.message}
          >
            <SelectRoot
              collection={sectionCollection}
              value={shopCategoryValue ? [shopCategoryValue] : []}
              onValueChange={(details) =>
                onShopCategoryChange(details.value[0] ?? "")
              }
            >
              <SelectTrigger>
                <SelectValueText placeholder="Selecione uma seção" />
              </SelectTrigger>
              <Portal>
                <SelectPositioner>
                  <SelectContent>
                    {sectionCollection.items.map((item) => (
                      <SelectItem key={item.value} item={item}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </SelectPositioner>
              </Portal>
            </SelectRoot>
          </Field>

          <Field
            label="Subcategoria"
            optionalText="(opcional)"
            helperText={
              shopCategoryValue
                ? "Não achou a subcategoria certa? Cadastre aqui."
                : "Selecione uma seção primeiro."
            }
            invalid={!!errors.category}
            errorText={errors.category?.message}
          >
            <SelectRoot
              collection={categoryCollection}
              value={[categoryValue || NO_CATEGORY_VALUE]}
              onValueChange={(details) =>
                onCategoryChange(details.value[0] ?? NO_CATEGORY_VALUE)
              }
              disabled={!shopCategoryValue}
            >
              <SelectTrigger>
                <SelectValueText placeholder="Selecione uma subcategoria" />
              </SelectTrigger>
              <Portal>
                <SelectPositioner>
                  <SelectContent>
                    {categoryCollection.items.map((item) => (
                      <SelectItem key={item.value} item={item}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </SelectPositioner>
              </Portal>
            </SelectRoot>
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
