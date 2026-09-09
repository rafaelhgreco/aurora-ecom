"use client";

import { Box, Button, Flex, Image, Text } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatPrice } from "@/app/utils/price-formatter";
import type { SerializedProduct as Product } from "@/core/schemas/product.schema";
import {
  getEffectiveColorVariants,
  getImagesForColor,
} from "@/shared/product-color-utils";
import {
  getAvailableSizes,
  getTotalStock,
} from "@/shared/product-stock-helpers";

/** Sombra atrás da foto (card) — alinhada ao design desejado */
export const PRODUCT_CARD_IMAGE_SHADOW =
  "0px 5px 17px 1px hsla(0, 0%, 0%, 0.16)";

export interface ProductCardProps {
  product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const router = useRouter();

  const id = product.id ?? "";
  const imageUrl = product.imageUrl;
  const title = product.title;
  const subtitle = product.subtitle;
  const price = product.price;
  const isActive = product.isActive !== false;

  const colorVariants = useMemo(
    () => getEffectiveColorVariants(product),
    [product],
  );

  const [selectedColor, setSelectedColor] = useState(
    () => colorVariants[0]?.color ?? "",
  );

  const lastProductIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const pid = product.id ?? "";
    if (lastProductIdRef.current === pid) return;
    lastProductIdRef.current = pid;
    setSelectedColor(getEffectiveColorVariants(product)[0]?.color ?? "");
  }, [product]);

  const effectiveColor = selectedColor || colorVariants[0]?.color || "";
  const hasColorVariants = colorVariants.length > 0;
  const isMultiColor = colorVariants.length > 1;

  const displayImage = useMemo(() => {
    if (!effectiveColor) return imageUrl;
    const imgs = getImagesForColor(product, effectiveColor);
    return imgs[0] ?? imageUrl;
  }, [product, effectiveColor, imageUrl]);

  const sizes = useMemo(
    () => getAvailableSizes(product, effectiveColor || undefined),
    [product, effectiveColor],
  );

  const stock = getTotalStock(product);

  const isAvailable = isActive && stock > 0;

  const handleClick = () => {
    router.push(`/produto/${id}`);
  };

  const handleCtaClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/produto/${id}`);
  };

  const handleColorClick = (e: React.MouseEvent, color: string) => {
    e.stopPropagation();
    setSelectedColor(color);
  };

  const formatted_price_value = formatPrice(price);

  const ctaLabel = isAvailable
    ? "COMPRAR"
    : "Me avise quando estiver disponível";

  const hasSizes = Boolean(isAvailable && sizes.length > 0);

  const renderColorPicker = (compact: boolean) =>
    !hasColorVariants ? null : (
      <Flex
        w="full"
        gap="1.5"
        flexWrap="wrap"
        justify={compact ? "center" : "flex-start"}
        role="listbox"
        aria-label="Cores"
        onClick={(e) => e.stopPropagation()}
      >
        {colorVariants.map((v) => {
          const active = v.color === effectiveColor;
          return (
            <Button
              key={v.color}
              type="button"
              role="option"
              aria-selected={active}
              variant="outline"
              size="xs"
              px="2"
              py="1"
              h="auto"
              minH="unset"
              fontSize="2xs"
              borderWidth="1px"
              borderColor={active ? "black" : "gray.300"}
              bg={active ? "gray.100" : "white"}
              fontWeight={active ? "semibold" : "normal"}
              cursor={isMultiColor ? "pointer" : "default"}
              onClick={(e) => {
                if (isMultiColor) handleColorClick(e, v.color);
              }}
            >
              {v.color}
            </Button>
          );
        })}
      </Flex>
    );

  const renderSizeChips = (overlay: boolean) =>
    !hasSizes ? null : (
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
      aria-label={`Ver produto: ${title}`}
    >
      <Box
        position="relative"
        overflow="hidden"
        aspectRatio="3/4"
        w="full"
        borderRadius="lg"
        boxShadow={PRODUCT_CARD_IMAGE_SHADOW}
        transition="box-shadow 0.25s ease, transform 0.2s ease"
        _groupHover={{
          boxShadow: "0px 8px 24px 10px rgba(0, 0, 0, 0.18)",
        }}
        _groupActive={{
          transform: { base: "scale(0.985)", md: "none" },
        }}
      >
        <Image
          src={displayImage}
          alt={title}
          w="full"
          h="full"
          objectFit="cover"
          loading="lazy"
          decoding="async"
          draggable={false}
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

        {/* Desktop: overlay no hover — CTA central + cores + tamanhos */}
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

          {(hasColorVariants || hasSizes) && (
            <Box
              w="full"
              p="2"
              pointerEvents="auto"
              display="flex"
              flexDirection="column"
              gap="2"
            >
              {hasColorVariants && (
                <Box>
                  <Text
                    fontSize="2xs"
                    color="whiteAlpha.900"
                    mb="1"
                    textAlign="center"
                  >
                    Cor
                  </Text>
                  {renderColorPicker(true)}
                </Box>
              )}
              {hasSizes && renderSizeChips(true)}
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

        {hasColorVariants && (
          <Box mt="2" onClick={(e) => e.stopPropagation()}>
            <Text fontSize="2xs" color="gray.500" mb="1" fontWeight="medium">
              Cor
            </Text>
            {renderColorPicker(false)}
          </Box>
        )}

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
            borderRadius="md"
            bg="gray.900"
            color="white"
            _hover={{ bg: "gray.800" }}
            _active={{ bg: "gray.700" }}
            w="full"
            whiteSpace="normal"
            textAlign="center"
            lineHeight="short"
            h="auto"
            minH="44px"
            py="2.5"
            px="3"
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
