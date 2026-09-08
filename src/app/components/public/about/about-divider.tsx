/**
 * Divisor decorativo entre seções — usa o emblema floral da marca para
 * marcar a transição sem recorrer a uma simples linha.
 */

import { Box, Flex, Image } from "@chakra-ui/react";

export function AboutDivider() {
  return (
    <Flex align="center" gap={{ base: 3, md: 5 }} w="full">
      <Box flex="1" h="1px" bg="gray.200" />
      <Image
        alt=""
        src="/aurora-emblem.png"
        w={{ base: "44px", md: "60px" }}
        h="auto"
        draggable={false}
      />
      <Box flex="1" h="1px" bg="gray.200" />
    </Flex>
  );
}
