/**
 * Hero da página Sobre — painel com o glow "aurora" (mesma técnica de
 * radial-gradients do header) apresentando a essência da marca, com o selo
 * da marca "carimbado" sobre o canto do painel.
 */

import { Box, Heading, Image, Text, VStack } from "@chakra-ui/react";
import { auroraRgba } from "./aurora-palette";

export function AboutHero() {
  return (
    <Box position="relative">
      <Box
        position="relative"
        overflow="hidden"
        borderRadius="32px"
        bg="gray.900"
        px={{ base: 6, md: 16 }}
        py={{ base: 14, md: 20 }}
        css={{
          "&::before": {
            content: '""',
            position: "absolute",
            top: "-40%",
            left: "-10%",
            width: "min(60vw, 560px)",
            height: "180%",
            background: `radial-gradient(ellipse 70% 50% at 50% 50%, ${auroraRgba(
              "indigo",
              0.55,
            )} 0%, ${auroraRgba("indigo", 0.12)} 45%, transparent 72%)`,
            filter: "blur(60px)",
            animation: "aurora-drift-a 16s ease-in-out infinite",
          },
          "&::after": {
            content: '""',
            position: "absolute",
            bottom: "-45%",
            right: "-15%",
            width: "min(55vw, 480px)",
            height: "180%",
            background: `radial-gradient(ellipse 65% 55% at 50% 50%, ${auroraRgba(
              "magenta",
              0.5,
            )} 0%, ${auroraRgba("teal", 0.18)} 45%, transparent 72%)`,
            filter: "blur(60px)",
            animation: "aurora-drift-b 18s ease-in-out infinite",
          },
          "@keyframes aurora-drift-a": {
            "0%, 100%": { transform: "translate(0, 0)" },
            "50%": { transform: "translate(6%, 4%)" },
          },
          "@keyframes aurora-drift-b": {
            "0%, 100%": { transform: "translate(0, 0)" },
            "50%": { transform: "translate(-5%, -5%)" },
          },
          "@media (prefers-reduced-motion: reduce)": {
            "&::before, &::after": { animation: "none" },
          },
        }}
      >
        <VStack
          position="relative"
          zIndex={1}
          align="flex-start"
          gap={{ base: 4, md: 5 }}
          maxW="720px"
        >
          <Text
            fontSize="xs"
            fontWeight="semibold"
            letterSpacing="0.14em"
            textTransform="uppercase"
            color={auroraRgba("teal", 0.9)}
          >
            Sobre a Aurora
          </Text>
          <Heading
            as="h1"
            size={{ base: "xl", md: "2xl" }}
            color="white"
            lineHeight={1.15}
            fontWeight="semibold"
          >
            Simplicidade, qualidade e verdade: é assim que servimos.
          </Heading>
        </VStack>
      </Box>

      <Image
        alt=""
        src="/brand-signature.png"
        position="absolute"
        bottom={{ base: "-24px", md: "-36px" }}
        right={{ base: "16px", md: "48px" }}
        w={{ base: "72px", md: "108px" }}
        h="auto"
        zIndex={2}
        filter="drop-shadow(0 10px 24px rgba(15, 23, 42, 0.35))"
        draggable={false}
      />
    </Box>
  );
}
