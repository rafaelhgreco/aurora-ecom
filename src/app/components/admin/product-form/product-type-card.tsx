"use no memo";
import { Card, Heading, HStack, Stack, Text } from "@chakra-ui/react";
import { IoPricetagOutline } from "react-icons/io5";
import { Switch } from "@/components/ui/switch";

interface ProductTypeCardProps {
  hasColorVariation: boolean;
  onHasColorVariationChange: (value: boolean) => void;
  hasSizeVariation: boolean;
  onHasSizeVariationChange: (value: boolean) => void;
}

/**
 * Card no topo do formulário: define se este produto tem variação de cor
 * e/ou tamanho. Não é persistido — inferido na leitura a partir de
 * `colorVariants.length` / `sizes.length` (mesmo princípio de
 * `inferSizePresetFromSizes`). Controla quais cards abaixo aparecem.
 */
export function ProductTypeCard({
  hasColorVariation,
  onHasColorVariationChange,
  hasSizeVariation,
  onHasSizeVariationChange,
}: ProductTypeCardProps) {
  return (
    <Card.Root>
      <Card.Header>
        <HStack gap={2}>
          <IoPricetagOutline />
          <Heading size="lg">Tipo de produto</Heading>
        </HStack>
        <Text color="gray.600" fontSize="sm" mt={1}>
          Desligue o que não se aplica — um combo ou item único não precisa de
          cor nem tamanho.
        </Text>
      </Card.Header>
      <Card.Body>
        <Stack gap={4}>
          <Switch
            checked={hasColorVariation}
            onCheckedChange={(e) => onHasColorVariationChange(e.checked)}
          >
            Este produto tem variação de COR
          </Switch>
          <Switch
            checked={hasSizeVariation}
            onCheckedChange={(e) => onHasSizeVariationChange(e.checked)}
          >
            Este produto tem variação de TAMANHO
          </Switch>
        </Stack>
      </Card.Body>
    </Card.Root>
  );
}
