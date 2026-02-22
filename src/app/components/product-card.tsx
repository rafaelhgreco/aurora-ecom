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
}

export const ProductCard = ({
  id,
  imageUrl,
  title,
  price,
  subtitle,
  alt,
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
      <Box overflow="hidden" aspectRatio="3/4" w="full">
        <Image
          src={imageUrl}
          alt={alt || title}
          w="full"
          h="full"
          objectFit="cover"
          transition="transform 0.4s ease"
          _groupHover={{ transform: "scale(1.05)" }}
        />
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
