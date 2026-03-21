import { Box, Button, Flex, Image, Text } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/app/utils/price-formatter";

export interface ProductCardProps {
  id: string;
  imageUrl: string;
  title: string;
  price: number;
  subtitle?: string;
  alt?: string;
  sizes?: string[];
  stock?: number;
  isActive?: boolean;
}

export const ProductCard = ({
  id,
  imageUrl,
  title,
  price,
  subtitle,
  alt,
  sizes,
  stock = 0,
  isActive = true,
}: ProductCardProps) => {
  const router = useRouter();

  const isAvailable = isActive && stock > 0;

  const handleClick = () => {
    router.push(`/produto/${id}`);
  };

  const handleCtaClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/produto/${id}`);
  };

  const formatted_price_value = formatPrice(price);

  const ctaLabel = isAvailable
    ? "COMPRAR"
    : "Me avise quando estiver disponível";

  const hasSizes = Boolean(isAvailable && sizes && sizes.length > 0);

  const renderSizeChips = (overlay: boolean) =>
    !hasSizes || !sizes ? null : (
      <Flex
        w="full"
        gap="2"
        flexWrap="wrap"
        justify={overlay ? "center" : "flex-start"}
      >
        {sizes.map((size) => (
          <Box
            key={size}
            px="2"
            py="0.5"
            bg={overlay ? "whiteAlpha.400" : "gray.100"}
            color={overlay ? "white" : "gray.800"}
            fontSize="xs"
            fontWeight="semibold"
            borderRadius="md"
          >
            {size}
          </Box>
        ))}
      </Flex>
    );

  return (
    <Box
      position="relative"
      cursor="pointer"
      className="group"
      w="full"
      onClick={handleClick}
    >
      <Box position="relative" overflow="hidden" aspectRatio="3/4" w="full">
        <Image
          src={imageUrl}
          alt={alt || title}
          w="full"
          h="full"
          objectFit="cover"
        />

        {!isAvailable && (
          <Box
            position="absolute"
            top="2"
            left="2"
            zIndex={3}
            px="2"
            py="1"
            bg="gray.900"
            color="white"
            fontSize="2xs"
            fontWeight="bold"
            letterSpacing="wider"
            borderRadius="sm"
          >
            ESGOTADO
          </Box>
        )}

        {/* Desktop: overlay no hover — CTA central + tamanhos embaixo */}
        <Flex
          display={{ base: "none", md: "flex" }}
          position="absolute"
          inset="0"
          direction="column"
          justify="space-between"
          align="stretch"
          bg="blackAlpha.600"
          backdropFilter="blur(2px)"
          opacity={0}
          transition="all 0.3s ease"
          _groupHover={{ opacity: 1 }}
          pointerEvents="none"
        >
          <Box
            flex="1"
            display="flex"
            alignItems="center"
            justifyContent="center"
            p="3"
          >
            <Button
              pointerEvents="auto"
              onClick={handleCtaClick}
              size="sm"
              fontWeight="bold"
              letterSpacing="wide"
              borderRadius="none"
              bg="white"
              color="gray.900"
              _hover={{ bg: "gray.100" }}
              maxW="90%"
              whiteSpace="normal"
              textAlign="center"
              lineHeight="short"
              h="auto"
              py="2"
              px="3"
              fontSize={isAvailable ? "sm" : "xs"}
            >
              {ctaLabel}
            </Button>
          </Box>

          {hasSizes && (
            <Box w="full" p="2" pointerEvents="auto">
              {renderSizeChips(true)}
            </Box>
          )}
        </Flex>
      </Box>

      <Flex direction="column" mt="4">
        <Text fontWeight="medium" fontSize="md" color="gray.900" lineClamp={1}>
          {title}
        </Text>
        {subtitle && (
          <Text fontSize="sm" color="gray.500" lineClamp={1}>
            {subtitle}
          </Text>
        )}
        <Text fontWeight="semibold" fontSize="sm" color="gray.900" mt="1">
          {formatted_price_value}
        </Text>

        <Flex
          display={{ base: "flex", md: "none" }}
          direction="column"
          gap="2"
          mt="3"
          w="full"
        >
          <Button
            onClick={handleCtaClick}
            size="sm"
            fontWeight="bold"
            letterSpacing="wide"
            borderRadius="none"
            bg="gray.900"
            color="white"
            _hover={{ bg: "gray.800" }}
            w="full"
            whiteSpace="normal"
            textAlign="center"
            lineHeight="short"
            h="auto"
            py="2"
            fontSize={isAvailable ? "sm" : "xs"}
          >
            {ctaLabel}
          </Button>
          {renderSizeChips(false)}
        </Flex>
      </Flex>
    </Box>
  );
};
