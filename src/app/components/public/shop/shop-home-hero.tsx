/**
 * Bloco de destaque da página /shop — conteúdo editorial (carrossel refinado depois).
 */

import { Box, Heading, Text, VStack } from "@chakra-ui/react";

interface ShopHomeHeroProps {
  title?: string;
  subtitle?: string;
}

export function ShopHomeHero({
  title = "Loja",
  subtitle = "Explore as categorias e encontre o que combina com você.",
}: ShopHomeHeroProps) {
  return (
    <VStack
      align="stretch"
      gap={{ base: 3, md: 4 }}
      w="full"
      textAlign="center"
    >
      <Heading as="h1" size={{ base: "xl", md: "2xl" }} color="gray.900">
        {title}
      </Heading>
      <Text
        color="gray.600"
        fontSize={{ base: "md", md: "lg" }}
        maxW="lg"
        mx="auto"
      >
        {subtitle}
      </Text>
      <Box
        w="full"
        minH={{ base: "140px", md: "180px" }}
        borderRadius="xl"
        bg="linear-gradient(135deg, #f7f7f7 0%, #ececec 50%, #f5f5f5 100%)"
        borderWidth="1px"
        borderColor="gray.200"
        display="flex"
        alignItems="center"
        justifyContent="center"
        px={4}
      >
        <Text fontSize="sm" color="gray.500" textAlign="center">
          Espaço para carrossel e campanhas — em breve.
        </Text>
      </Box>
    </VStack>
  );
}
