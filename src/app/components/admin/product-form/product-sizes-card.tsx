"use no memo";
import {
  Button,
  Card,
  Flex,
  Heading,
  HStack,
  IconButton,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import type { FieldErrors } from "react-hook-form";
import { IoClose, IoResizeOutline } from "react-icons/io5";
import { Checkbox } from "@/components/ui/checkbox";
import type {
  ProductFormInput,
  SizePresetKind,
} from "@/core/schemas/product.schema";

interface ProductSizesCardProps {
  sizePreset: string;
  applySizePreset: (preset: SizePresetKind) => void;
  presetOptions: readonly string[];
  selectedSizes: string[];
  handleToggleSize: (size: string) => void;
  customSizeDraft: string;
  setCustomSizeDraft: (draft: string) => void;
  handleAddCustomSize: () => void;
  handleRemoveCustomSize: (size: string) => void;
  errors?: FieldErrors<ProductFormInput>;
}

export function ProductSizesCard({
  sizePreset,
  applySizePreset,
  presetOptions,
  selectedSizes,
  handleToggleSize,
  customSizeDraft,
  setCustomSizeDraft,
  handleAddCustomSize,
  handleRemoveCustomSize,
  errors,
}: ProductSizesCardProps) {
  return (
    <Card.Root>
      <Card.Header>
        <HStack gap={2}>
          <IoResizeOutline />
          <Heading size="lg">Tamanhos / variações</Heading>
        </HStack>
        <Text color="gray.600" fontSize="sm" mt={1}>
          (opcional) — escolha roupas, volumes (ml) ou rótulos personalizados.
        </Text>
      </Card.Header>
      <Card.Body>
        <Text fontWeight="medium" mb={2}>
          Tipo de variação
        </Text>
        <HStack flexWrap="wrap" gap={2} mb={3}>
          <Button
            type="button"
            size="sm"
            variant={sizePreset === "clothing" ? "solid" : "outline"}
            onClick={() => applySizePreset("clothing")}
          >
            Roupas (PP…XG)
          </Button>
          <Button
            type="button"
            size="sm"
            variant={sizePreset === "volume" ? "solid" : "outline"}
            onClick={() => applySizePreset("volume")}
          >
            Volumes (ml)
          </Button>
          <Button
            type="button"
            size="sm"
            variant={sizePreset === "custom" ? "solid" : "outline"}
            onClick={() => applySizePreset("custom")}
          >
            Personalizado
          </Button>
        </HStack>

        <Text fontSize="sm" color="gray.600" mb={3}>
          {sizePreset === "clothing" &&
            "Tamanhos de vestuário oferecidos por este produto."}
          {sizePreset === "volume" &&
            "Capacidades em mililitros (cosméticos, líquidos, etc.)."}
          {sizePreset === "custom" && "Rótulos livres (ex.: 30ml, Único)."}
        </Text>

        {sizePreset !== "custom" ? (
          <Flex gap={4} wrap="wrap">
            {presetOptions.map((size) => (
              <Checkbox
                key={size}
                checked={selectedSizes.includes(size)}
                onCheckedChange={() => handleToggleSize(size)}
              >
                {size}
              </Checkbox>
            ))}
          </Flex>
        ) : (
          <Stack gap={3}>
            <HStack flexWrap="wrap" gap={2}>
              <Input
                maxLength={32}
                placeholder='Ex.: 30ml, "Único"'
                value={customSizeDraft}
                onChange={(e) => setCustomSizeDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCustomSize();
                  }
                }}
                maxW="280px"
              />
              <Button type="button" size="sm" onClick={handleAddCustomSize}>
                Adicionar
              </Button>
            </HStack>
            {selectedSizes.length > 0 ? (
              <Flex flexWrap="wrap" gap={2}>
                {selectedSizes.map((s) => (
                  <HStack
                    key={s}
                    bg="gray.100"
                    borderRadius="md"
                    px={2}
                    py={1}
                    gap={1}
                  >
                    <Text fontSize="sm">{s}</Text>
                    <IconButton
                      aria-label={`Remover ${s}`}
                      size="2xs"
                      variant="ghost"
                      minW="44px"
                      minH="44px"
                      onClick={() => handleRemoveCustomSize(s)}
                    >
                      <IoClose />
                    </IconButton>
                  </HStack>
                ))}
              </Flex>
            ) : (
              <Text fontSize="sm" color="gray.500">
                Nenhum rótulo personalizado adicionado.
              </Text>
            )}
          </Stack>
        )}
        {errors?.sizes && (
          <Text color="red.500" fontSize="sm" mt={2}>
            {errors.sizes.message}
          </Text>
        )}
      </Card.Body>
    </Card.Root>
  );
}
