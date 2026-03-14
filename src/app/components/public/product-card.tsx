import { Box, Flex, Image, Text } from "@chakra-ui/react";
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
}

export const ProductCard = ({
  id,
  imageUrl,
  title,
  price,
  subtitle,
  alt,
  sizes,
}: ProductCardProps) => {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/produto/${id}`);
  };

  const formatted_price_value = formatPrice(price);

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
          transition="transform 0.4s ease"
          _groupHover={{ transform: "scale(1.05)" }}
        />

        {sizes && sizes.length > 0 && (
          <Flex
            position="absolute"
            bottom="0"
            left="0"
            w="full"
            p="2"
            gap="2"
            flexWrap="wrap"
            justify="center"
            bg="blackAlpha.600"
            backdropFilter="blur(2px)"
            opacity={{ base: 1, md: 0 }}
            transform={{ base: "translateY(0)", md: "translateY(100%)" }}
            transition="all 0.3s ease"
            _groupHover={{ opacity: 1, transform: "translateY(0)" }}
          >
            {sizes.map((size) => (
              <Box
                key={size}
                px="2"
                py="0.5"
                bg="whiteAlpha.400"
                color="white"
                fontSize="xs"
                fontWeight="semibold"
                borderRadius="md"
              >
                {size}
              </Box>
            ))}
          </Flex>
        )}
      </Box>

      <Flex
        direction="column"
        mt="4"
        opacity={{ base: 1, md: 0 }}
        transform={{ base: "translateY(0)", md: "translateY(10px)" }}
        transition="all 0.3s ease"
        _groupHover={{ opacity: 1, transform: "translateY(0)" }}
      >
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
      </Flex>
    </Box>
  );
};
