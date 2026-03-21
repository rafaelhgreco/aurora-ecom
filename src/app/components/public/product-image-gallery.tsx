import { Box, Flex, Image } from "@chakra-ui/react";
import { useState } from "react";

interface ProductImageGalleryProps {
  images: string[];
  alt: string;
}

export const ProductImageGallery = ({
  images,
  alt,
}: ProductImageGalleryProps) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const safeImages = images?.length ? images : [];
  const currentSrc = safeImages[selectedImage] ?? safeImages[0];

  if (safeImages.length === 0) {
    return (
      <Box
        aspectRatio="3/4"
        w="full"
        maxH={{ base: "500px", md: "700px" }}
        bg="gray.100"
        borderRadius="md"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Box color="gray.400" fontSize="sm">
          Sem imagem
        </Box>
      </Box>
    );
  }

  return (
    <Flex gap="4" w="full" direction={{ base: "column-reverse", md: "row" }}>
      {/* Thumbnails */}
      <Flex
        direction={{ base: "row", md: "column" }}
        gap="2"
        maxH={{ base: "auto", md: "600px" }}
        w={{ base: "full", md: "auto" }}
        overflowY={{ base: "hidden", md: "auto" }}
        overflowX={{ base: "auto", md: "hidden" }}
        css={{
          "&::-webkit-scrollbar": {
            width: "4px",
            height: "4px",
          },
          "&::-webkit-scrollbar-track": {
            width: "6px",
            height: "6px",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "#CBD5E0",
            borderRadius: "24px",
          },
        }}
      >
        {safeImages.map((image, index) => (
          <Box
            key={`thumb-${image}`}
            flexShrink={0}
            w={{ base: "60px", md: "80px" }}
            h={{ base: "60px", md: "80px" }}
            cursor="pointer"
            border="2px solid"
            borderColor={selectedImage === index ? "gray.900" : "gray.200"}
            borderRadius="md"
            overflow="hidden"
            onClick={() => setSelectedImage(index)}
            transition="all 0.2s"
            _hover={{ borderColor: "gray.900" }}
          >
            <Image
              src={image}
              alt={`${alt} - Imagem ${index + 1}`}
              w="full"
              h="full"
              objectFit="cover"
            />
          </Box>
        ))}
      </Flex>

      {/* Imagem principal */}
      <Box
        flex="1"
        aspectRatio="3/4"
        w="full"
        maxH={{ base: "500px", md: "700px" }}
        overflow="hidden"
        borderRadius="md"
      >
        <Image src={currentSrc} alt={alt} w="full" h="full" objectFit="cover" />
      </Box>
    </Flex>
  );
};
