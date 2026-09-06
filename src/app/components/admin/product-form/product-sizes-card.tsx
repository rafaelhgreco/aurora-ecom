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
import { IoClose } from "react-icons/io5";
import { Checkbox } from "@/components/ui/checkbox";

interface ProductSizesCardProps {
  sizePreset: string;
  applySizePreset: (preset: any) => void;
  presetOptions: readonly string[];
  selectedSizes: string[];
  handleToggleSize: (size: string) => void;
  customSizeDraft: string;
  setCustomSizeDraft: (draft: string) => void;
  handleAddCustomSize: () => void;
  handleRemoveCustomSize: (size: string) => void;
  errors?: any;
  isEdit?: boolean;
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
  isEdit,
}: ProductSizesCardProps) {
  return (
    <Card.Root>
      <Card.Header>
        <Heading size="lg">Tamanhos / variações *</Heading>
        {isEdit && (
          <Text color="gray.600" fontSize="sm" mt={1}>
            Escolha roupas, volumes (ml) ou rótulos personalizados.
          </Text>
        )}
      </Card.Header>
      <Card.Body>
        {isEdit && (
          <Text fontWeight="medium" mb={2}>
            Tipo de variação
          </Text>
        )}
        <HStack flexWrap="wrap" gap={2} mb={3}>
          <Button
            type="button"
            size="sm"
            variant={sizePreset === "clothing" ? "solid" : "outline"}
            onClick={() => applySizePreset("clothing")}
          >
            {isEdit ? "Roupas (PP…XG)" : "Roupas"}
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

        {isEdit && (
          <Text fontSize="sm" color="gray.600" mb={3}>
            {sizePreset === "clothing" &&
              "Tamanhos de vestuário oferecidos por este produto."}
            {sizePreset === "volume" &&
              "Capacidades em mililitros (cosméticos, líquidos, etc.)."}
            {sizePreset === "custom" && "Rótulos livres (ex.: 30ml, Único)."}
          </Text>
        )}

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
                placeholder={isEdit ? 'Ex.: 30ml, "Único"' : "Ex.: 30ml"}
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
            {(!isEdit || selectedSizes.length > 0) && (
              <Flex flexWrap="wrap" gap={2}>
                {(selectedSizes || []).map((s) => (
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
                      onClick={() => handleRemoveCustomSize(s)}
                    >
                      <IoClose />
                    </IconButton>
                  </HStack>
                ))}
              </Flex>
            )}
            {isEdit && selectedSizes.length === 0 && (
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
