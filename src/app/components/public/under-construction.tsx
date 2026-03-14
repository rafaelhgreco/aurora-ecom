import { Box, Button, Text, VStack } from "@chakra-ui/react";
import Link from "next/link";
import { FiHome, FiTool } from "react-icons/fi";

export const UnderConstruction = () => {
  return (
    <VStack
      gap="6"
      textAlign="center"
      py={{ base: "16", md: "24" }}
      px="4"
      w="full"
      minH="50vh"
      justify="center"
    >
      <Box fontSize={{ base: "5xl", md: "7xl" }} color="gray.400">
        <FiTool />
      </Box>
      <Text fontSize={{ base: "md", md: "lg" }} color="gray.600" maxW="lg">
        Página em construção, agradecemos ao utilizar nosso site.
      </Text>
      <Button
        asChild
        colorScheme="black"
        bg="black"
        color="white"
        size="lg"
        mt="4"
        _hover={{ bg: "gray.800" }}
      >
        <Link href="/">
          <FiHome style={{ marginRight: "8px" }} />
          Voltar para o início
        </Link>
      </Button>
    </VStack>
  );
};
