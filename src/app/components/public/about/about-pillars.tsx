/**
 * Missão e Visão em blocos alternados — cada um com sua cor própria dentro
 * do espectro aurora, reforçando a ideia de progressão em vez de repetição.
 */

import { Box, Flex, Heading, Text, VStack } from "@chakra-ui/react";
import type { IconType } from "react-icons";
import {
  IoCheckmarkCircleOutline,
  IoCompassOutline,
  IoEyeOutline,
  IoStarOutline,
} from "react-icons/io5";
import { type AuroraColor, auroraRgba } from "./aurora-palette";

const MISSION_BULLETS = [
  "Ouvir genuinamente o que as mulheres precisam",
  "Criar soluções práticas e confiáveis",
  "Oferecer qualidade acessível e consistente",
  "Comunicar com transparência total",
  "Estar presente nos momentos reais da vida das mulheres",
];

const VISION_BULLETS = [
  "Ser sinônimo de confiança inquestionável",
  "Ter mudado a forma como as mulheres veem produtos de moda e beleza",
  "Ser a marca que realmente as entende",
  "Ter mantido integridade e honestidade em cada passo do caminho",
];

interface PillarProps {
  eyebrow: string;
  title: string;
  statement: string;
  bullets: string[];
  bulletIcon: IconType;
  icon: IconType;
  color: AuroraColor;
  reverse?: boolean;
}

function Pillar({
  eyebrow,
  title,
  statement,
  bullets,
  bulletIcon: BulletIcon,
  icon: Icon,
  color,
  reverse,
}: PillarProps) {
  return (
    <Flex
      direction={{ base: "column", md: reverse ? "row-reverse" : "row" }}
      align="center"
      gap={{ base: 8, md: 12 }}
      w="full"
    >
      <Flex
        flex="0 0 auto"
        align="center"
        justify="center"
        w={{ base: "88px", md: "140px" }}
        h={{ base: "88px", md: "140px" }}
        borderRadius="full"
        bg={auroraRgba(color, 0.1)}
        border="1px solid"
        borderColor={auroraRgba(color, 0.25)}
        color={auroraRgba(color, 1)}
        fontSize={{ base: "3xl", md: "5xl" }}
      >
        <Icon />
      </Flex>

      <VStack align="flex-start" gap={3} flex="1" w="full">
        <Text
          fontSize="xs"
          fontWeight="semibold"
          letterSpacing="0.12em"
          textTransform="uppercase"
          color={auroraRgba(color, 1)}
        >
          {eyebrow}
        </Text>
        <Heading as="h2" size={{ base: "lg", md: "xl" }} color="gray.900">
          {title}
        </Heading>
        <Text
          fontSize={{ base: "md", md: "lg" }}
          color="gray.700"
          fontWeight="medium"
        >
          {statement}
        </Text>
        <VStack align="flex-start" gap={2} mt={2} w="full">
          {bullets.map((bullet) => (
            <Flex key={bullet} align="flex-start" gap={2}>
              <Box color={auroraRgba(color, 1)} mt="2px" flexShrink={0}>
                <BulletIcon />
              </Box>
              <Text fontSize="sm" color="gray.600">
                {bullet}
              </Text>
            </Flex>
          ))}
        </VStack>
      </VStack>
    </Flex>
  );
}

export function AboutPillars() {
  return (
    <VStack align="stretch" gap={{ base: 12, md: 20 }} w="full">
      <Pillar
        eyebrow="Missão"
        title="Ser a marca que mais entende as mulheres"
        statement="Oferecendo produtos de qualidade excepcional e fáceis de usar, com a honestidade e integridade que elas merecem."
        bullets={MISSION_BULLETS}
        bulletIcon={IoCheckmarkCircleOutline}
        icon={IoCompassOutline}
        color="indigo"
      />
      <Pillar
        eyebrow="Visão"
        title="Transformar a relação das mulheres com moda e beleza"
        statement="Tornando essa relação mais simples, confiável e autêntica."
        bullets={VISION_BULLETS}
        bulletIcon={IoStarOutline}
        icon={IoEyeOutline}
        color="magenta"
        reverse
      />
    </VStack>
  );
}
