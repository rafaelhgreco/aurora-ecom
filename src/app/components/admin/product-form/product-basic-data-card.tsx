import { Box, Card, Heading, Input, Stack, Textarea } from "@chakra-ui/react";
import { Field } from "@/components/ui/field";
import {
  SHOP_CATEGORY_IDS,
  SHOP_CATEGORY_LABELS,
} from "@/core/catalog/shop-catalog";

interface ProductBasicDataCardProps {
  register: any;
  errors: any;
  isEdit?: boolean;
}

export function ProductBasicDataCard({
  register,
  errors,
  isEdit,
}: ProductBasicDataCardProps) {
  return (
    <Card.Root>
      <Card.Header>
        <Heading size="lg">Dados Básicos</Heading>
      </Card.Header>
      <Card.Body>
        <Stack gap={4}>
          <Field
            label="Título *"
            invalid={!!errors.title}
            errorText={errors.title?.message}
          >
            <Input {...register("title")} placeholder="Ex: Camiseta Básica" />
          </Field>

          <Field
            label="Subtítulo"
            invalid={!!errors.subtitle}
            errorText={errors.subtitle?.message}
          >
            <Input {...register("subtitle")} placeholder="Ex: 100% Algodão" />
          </Field>

          <Field
            label="Descrição *"
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
            invalid={!!errors.category}
            errorText={errors.category?.message}
          >
            <Input {...register("category")} placeholder="Ex: Camisetas" />
          </Field>

          {isEdit && (
            <>
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

              <Field
                label="Status"
                helperText="DRAFT: produto ainda não enriquecido. ACTIVE: publicado na loja."
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
                  <option value="DRAFT">🔄 DRAFT - Em rascunho</option>
                  <option value="ACTIVE">✅ ACTIVE - Publicado</option>
                </Box>
              </Field>
            </>
          )}
        </Stack>
      </Card.Body>
    </Card.Root>
  );
}
