/**
 * Grid dos 4 valores fundamentais — cada card com um acento de cor do
 * espectro aurora, reaproveitando o padrão de card de shop-category-cards.
 */

import { Box, Flex, Heading, SimpleGrid, Text, VStack } from "@chakra-ui/react";
import type { IconType } from "react-icons";
import {
  IoColorWandOutline,
  IoCompassOutline,
  IoDiamondOutline,
  IoShieldCheckmarkOutline,
} from "react-icons/io5";
import { type AuroraColor, auroraRgba } from "./aurora-palette";

interface ValueItem {
  title: string;
  subtitle: string;
  description: string;
  icon: IconType;
  color: AuroraColor;
}

const VALUES: ValueItem[] = [
  {
    title: "Honestidade",
    subtitle: "O alicerce de tudo o que fazemos",
    description:
      "Comunicamos com transparência total. Sem promessas vazias, sem artificialidades. Nossas mulheres merecem saber exatamente o que estão comprando e por quê. Cada produto, cada decisão, cada ação nossa reflete essa verdade fundamental.",
    icon: IoShieldCheckmarkOutline,
    color: "indigo",
  },
  {
    title: "Facilidade",
    subtitle: "Simplicidade em cada detalhe",
    description:
      "Tornamos a vida das mulheres mais simples. Desde a escolha do produto até o resultado final, remover complicações é nossa obsessão. Produtos que funcionam, que são fáceis de usar, que economizam tempo real.",
    icon: IoColorWandOutline,
    color: "teal",
  },
  {
    title: "Qualidade",
    subtitle: "Excelência não é negociável",
    description:
      "Qualidade está em cada fio, em cada fórmula, em cada detalhe. Produtos que duram, que funcionam, que fazem diferença real. Não competimos por preço, mas por durabilidade e resultados.",
    icon: IoDiamondOutline,
    color: "magenta",
  },
  {
    title: "Integridade",
    subtitle: "Coerência entre o que dizemos e fazemos",
    description:
      "Nossas ações refletem nossos valores. Fazemos o que promete, nos responsabilizamos, agimos com coerência moral. Somos confiáveis porque somos íntegras.",
    icon: IoCompassOutline,
    color: "sky",
  },
];

export function AboutValuesGrid() {
  return (
    <VStack align="stretch" gap={{ base: 5, md: 6 }} w="full">
      <VStack align="flex-start" gap={1}>
        <Text
          fontSize="xs"
          fontWeight="semibold"
          letterSpacing="0.12em"
          textTransform="uppercase"
          color="gray.500"
        >
          Valores fundamentais
        </Text>
        <Heading as="h2" size={{ base: "lg", md: "xl" }} color="gray.900">
          O que nos guia todos os dias
        </Heading>
      </VStack>

      <SimpleGrid
        columns={{ base: 1, md: 2 }}
        gap={{ base: 4, md: 5 }}
        w="full"
      >
        {VALUES.map(({ title, subtitle, description, icon: Icon, color }) => (
          <Box
            key={title}
            position="relative"
            borderWidth="1px"
            borderColor="gray.200"
            borderRadius="xl"
            overflow="hidden"
            bg="white"
            transition="box-shadow 0.2s, border-color 0.2s, transform 0.2s"
            _hover={{
              borderColor: auroraRgba(color, 0.4),
              boxShadow: "lg",
              transform: "translateY(-2px)",
            }}
          >
            <Box
              position="absolute"
              top={0}
              left={0}
              right={0}
              h="4px"
              bg={auroraRgba(color, 0.9)}
            />
            <VStack align="flex-start" gap={3} p={{ base: 5, md: 6 }}>
              <Flex
                align="center"
                justify="center"
                w="44px"
                h="44px"
                borderRadius="lg"
                bg={auroraRgba(color, 0.12)}
                color={auroraRgba(color, 1)}
                fontSize="xl"
              >
                <Icon />
              </Flex>
              <VStack align="flex-start" gap={0}>
                <Heading as="h3" size="sm" color="gray.900">
                  {title}
                </Heading>
                <Text fontSize="xs" color="gray.500" fontWeight="medium">
                  {subtitle}
                </Text>
              </VStack>
              <Text fontSize="sm" color="gray.600">
                {description}
              </Text>
            </VStack>
          </Box>
        ))}
      </SimpleGrid>
    </VStack>
  );
}
