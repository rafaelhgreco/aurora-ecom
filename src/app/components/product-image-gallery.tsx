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

  return (
    <Flex gap="4" w="full">
      {/* Thumbnails verticais */}
      <Flex direction="column" gap="2" maxH="600px" overflowY="auto">
        {images.map((image, index) => (
          <Box
            key={`thumb-${image}`}
            w="80px"
            h="80px"
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
      <Box flex="1" aspectRatio="1" overflow="hidden" borderRadius="md">
        <Image
          src={images[selectedImage]}
          alt={alt}
          w="full"
          h="full"
          objectFit="cover"
        />
      </Box>
    </Flex>
  );
};
