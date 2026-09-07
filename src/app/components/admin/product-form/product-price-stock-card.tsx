import {
  Card,
  Heading,
  HStack,
  Input,
  InputGroup,
  Stack,
  Text,
} from "@chakra-ui/react";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { IoPricetagOutline } from "react-icons/io5";
import { Field } from "@/components/ui/field";
import type { ProductFormValues } from "@/core/schemas/product.schema";

interface ProductPriceStockCardProps {
  register: UseFormRegister<ProductFormValues>;
  errors: FieldErrors<ProductFormValues>;
  selectedSizesLength?: number;
}

export function ProductPriceStockCard({
  register,
  errors,
  selectedSizesLength = 0,
}: ProductPriceStockCardProps) {
  return (
    <Card.Root>
      <Card.Header>
        <HStack gap={2}>
          <IoPricetagOutline />
          <Heading size="lg">Preço e Estoque</Heading>
        </HStack>
      </Card.Header>
      <Card.Body>
        <Stack gap={4}>
          <Field
            label="Preço"
            required
            helperText="Use ponto para casas decimais, ex: 49.90"
            invalid={!!errors.price}
            errorText={errors.price?.message}
          >
            <InputGroup startElement={<Text color="gray.500">R$</Text>}>
              <Input
                {...register("price", { valueAsNumber: true })}
                type="number"
                step="0.01"
                placeholder="49.90"
              />
            </InputGroup>
          </Field>
          {selectedSizesLength === 0 ? (
            <Field
              label="Estoque"
              optionalText="(opcional)"
              helperText="Se vazio, o produto é cadastrado com estoque 0."
              invalid={!!errors.stock}
              errorText={errors.stock?.message}
            >
              <InputGroup
                endElement={
                  <Text color="gray.500" fontSize="sm">
                    unid.
                  </Text>
                }
              >
                <Input
                  {...register("stock", { valueAsNumber: true })}
                  type="number"
                  placeholder="100"
                />
              </InputGroup>
            </Field>
          ) : (
            <Text fontSize="sm" color="gray.600">
              Com tamanhos ativos, o estoque é definido por cor na seção
              &quot;Cores e fotos&quot; (cada cor com quantidades por tamanho).
            </Text>
          )}
        </Stack>
      </Card.Body>
    </Card.Root>
  );
}
