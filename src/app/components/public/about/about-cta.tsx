/**
 * Chamada final da página Sobre — leva para a loja.
 */

import { Button, Heading, Text, VStack } from "@chakra-ui/react";
import Link from "next/link";
import { IoArrowForward } from "react-icons/io5";

export function AboutCta() {
  return (
    <VStack align="center" textAlign="center" gap={4} py={{ base: 10, md: 14 }}>
      <Heading as="h2" size={{ base: "md", md: "lg" }} color="gray.900">
        Conheça os produtos que carregam esses valores
      </Heading>
      <Text fontSize="sm" color="gray.600" maxW="480px">
        Cada peça e cada fórmula nasce do mesmo compromisso: honestidade,
        facilidade, qualidade e integridade.
      </Text>
      <Button
        asChild
        bg="black"
        color="white"
        size="lg"
        _hover={{ bg: "gray.800" }}
      >
        <Link href="/loja">
          Ver a loja
          <IoArrowForward style={{ marginLeft: "8px" }} />
        </Link>
      </Button>
    </VStack>
  );
}
