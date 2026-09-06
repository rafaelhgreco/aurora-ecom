import { Card, Grid, Heading, Input, Stack, Text } from "@chakra-ui/react";
import { Field } from "@/components/ui/field";

interface ProductPriceStockCardProps {
  register: any;
  errors: any;
  isEdit?: boolean;
  selectedSizesLength?: number;
}

export function ProductPriceStockCard({
  register,
  errors,
  isEdit,
  selectedSizesLength = 0,
}: ProductPriceStockCardProps) {
  return (
    <Card.Root>
      <Card.Header>
        <Heading size="lg">Preço e Estoque</Heading>
      </Card.Header>
      <Card.Body>
        {isEdit ? (
          <Stack gap={4}>
            <Field
              label="Preço (R$) *"
              invalid={!!errors.price}
              errorText={errors.price?.message}
            >
              <Input
                {...register("price", { valueAsNumber: true })}
                type="number"
                step="0.01"
              />
            </Field>
            {selectedSizesLength === 0 ? (
              <Field
                label="Estoque *"
                invalid={!!errors.stock}
                errorText={errors.stock?.message}
              >
                <Input
                  {...register("stock", { valueAsNumber: true })}
                  type="number"
                />
              </Field>
            ) : (
              <Text fontSize="sm" color="gray.600">
                Com tamanhos ativos, o estoque é definido por cor na seção
                &quot;Cores e fotos&quot; (cada cor com quantidades por
                tamanho).
              </Text>
            )}
          </Stack>
        ) : (
          <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
            {/* Preço */}
            <Field
              label="Preço (R$) *"
              invalid={!!errors.price}
              errorText={errors.price?.message}
            >
              <Input
                {...register("price", { valueAsNumber: true })}
                type="number"
                step="0.01"
                placeholder="99.90"
              />
            </Field>

            {/* Estoque */}
            <Field
              label="Estoque *"
              invalid={!!errors.stock}
              errorText={errors.stock?.message}
            >
              <Input
                {...register("stock", { valueAsNumber: true })}
                type="number"
                placeholder="100"
              />
            </Field>
          </Grid>
        )}
      </Card.Body>
    </Card.Root>
  );
}
