"use client";

import {
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Image,
  Text,
} from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";
import {
  IoAdd,
  IoChevronBack,
  IoChevronForward,
  IoRemove,
} from "react-icons/io5";
import { LuZoomIn } from "react-icons/lu";
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from "@/components/ui/dialog";

interface ProductImageGalleryProps {
  images: string[];
  alt: string;
}

const ZOOM_MIN = 1;
const ZOOM_MAX = 3;
const ZOOM_STEP = 0.25;

export const ProductImageGallery = ({
  images,
  alt,
}: ProductImageGalleryProps) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [zoom, setZoom] = useState(ZOOM_MIN);

  const safeImages = images?.length ? images : [];
  const currentSrc = safeImages[selectedImage] ?? safeImages[0];
  const lightboxSrc = safeImages[lightboxIndex] ?? safeImages[0];
  const count = safeImages.length;

  const imagesKey = safeImages.join("|");

  // biome-ignore lint/correctness/useExhaustiveDependencies: string estável para reset quando a lista muda
  useEffect(() => {
    setSelectedImage(0);
    setLightboxOpen(false);
    setLightboxIndex(0);
    setZoom(ZOOM_MIN);
  }, [imagesKey]);

  const openLightbox = useCallback(() => {
    setLightboxIndex(selectedImage);
    setZoom(ZOOM_MIN);
    setLightboxOpen(true);
  }, [selectedImage]);

  const goPrev = useCallback(() => {
    setLightboxIndex((i) => (i - 1 + count) % count);
    setZoom(ZOOM_MIN);
  }, [count]);

  const goNext = useCallback(() => {
    setLightboxIndex((i) => (i + 1) % count);
    setZoom(ZOOM_MIN);
  }, [count]);

  useEffect(() => {
    if (!lightboxOpen || count <= 1) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLightboxOpen(false);
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen, count, goPrev, goNext]);

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
    <>
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

        {/* Imagem principal + lupa */}
        <Box
          flex="1"
          position="relative"
          aspectRatio="3/4"
          w="full"
          maxH={{ base: "500px", md: "700px" }}
          overflow="hidden"
          borderRadius="md"
        >
          <Image
            src={currentSrc}
            alt={alt}
            w="full"
            h="full"
            objectFit="cover"
          />
          <IconButton
            aria-label="Ampliar imagem"
            title="Ampliar imagem"
            position="absolute"
            top={3}
            right={3}
            size="md"
            borderRadius="full"
            bg="blackAlpha.600"
            color="white"
            _hover={{ bg: "blackAlpha.800" }}
            onClick={openLightbox}
          >
            <LuZoomIn size={22} />
          </IconButton>
        </Box>
      </Flex>

      <DialogRoot
        open={lightboxOpen}
        onOpenChange={(e: { open: boolean }) => {
          if (!e.open) {
            setLightboxOpen(false);
            setZoom(ZOOM_MIN);
          }
        }}
        size="full"
        placement="center"
      >
        <DialogContent
          maxW="100vw"
          w="100vw"
          h="100dvh"
          maxH="100dvh"
          m={0}
          borderRadius="0"
          bg="blackAlpha.950"
          p={0}
          display="flex"
          flexDirection="column"
          borderWidth={0}
        >
          <DialogHeader
            pt={4}
            pb={2}
            px={4}
            borderBottomWidth="1px"
            borderColor="whiteAlpha.200"
            flexShrink={0}
          >
            <Flex align="center" justify="space-between" gap={3} w="full">
              <DialogTitle color="white" fontSize="md" fontWeight="medium">
                {alt}
                {count > 1 && (
                  <Text as="span" fontWeight="normal" color="whiteAlpha.700">
                    {" "}
                    ({lightboxIndex + 1} / {count})
                  </Text>
                )}
              </DialogTitle>
              <DialogCloseTrigger
                color="white"
                _hover={{ bg: "whiteAlpha.200" }}
              />
            </Flex>
          </DialogHeader>

          <DialogBody
            flex="1"
            display="flex"
            flexDirection="column"
            minH={0}
            p={0}
            overflow="hidden"
          >
            {/* Controles de zoom */}
            <HStack
              justify="center"
              gap={2}
              py={3}
              px={4}
              flexShrink={0}
              borderBottomWidth="1px"
              borderColor="whiteAlpha.200"
            >
              <IconButton
                aria-label="Diminuir zoom"
                size="sm"
                variant="ghost"
                color="white"
                disabled={zoom <= ZOOM_MIN}
                onClick={() =>
                  setZoom((z) =>
                    Math.max(ZOOM_MIN, Math.round((z - ZOOM_STEP) * 100) / 100),
                  )
                }
              >
                <IoRemove size={20} />
              </IconButton>
              <Text
                color="whiteAlpha.900"
                fontSize="sm"
                minW="52px"
                textAlign="center"
              >
                {Math.round(zoom * 100)}%
              </Text>
              <IconButton
                aria-label="Aumentar zoom"
                size="sm"
                variant="ghost"
                color="white"
                disabled={zoom >= ZOOM_MAX}
                onClick={() =>
                  setZoom((z) =>
                    Math.min(ZOOM_MAX, Math.round((z + ZOOM_STEP) * 100) / 100),
                  )
                }
              >
                <IoAdd size={20} />
              </IconButton>
              <Button
                size="sm"
                variant="outline"
                borderColor="whiteAlpha.400"
                color="white"
                _hover={{ bg: "whiteAlpha.200" }}
                onClick={() => setZoom(ZOOM_MIN)}
              >
                Redefinir
              </Button>
            </HStack>

            {/* Área da imagem + navegação */}
            <Flex
              flex="1"
              position="relative"
              minH={0}
              align="center"
              justify="center"
            >
              {count > 1 && (
                <IconButton
                  aria-label="Imagem anterior"
                  position="absolute"
                  left={{ base: 2, md: 4 }}
                  zIndex={2}
                  size="lg"
                  borderRadius="full"
                  bg="blackAlpha.500"
                  color="white"
                  _hover={{ bg: "blackAlpha.700" }}
                  onClick={goPrev}
                >
                  <IoChevronBack size={28} />
                </IconButton>
              )}

              <Box
                flex="1"
                h="full"
                w="full"
                overflow="auto"
                display="flex"
                alignItems="center"
                justifyContent="center"
                px={{ base: count > 1 ? 14 : 4, md: count > 1 ? 20 : 8 }}
                py={4}
                css={{
                  WebkitOverflowScrolling: "touch",
                }}
              >
                <Box
                  transform={`scale(${zoom})`}
                  transformOrigin="center center"
                  transition="transform 0.2s ease-out"
                  display="inline-flex"
                  maxW="full"
                >
                  <Image
                    src={lightboxSrc}
                    alt={`${alt} — ampliada ${lightboxIndex + 1}`}
                    maxW={{ base: "100%", md: "min(90vw, 1200px)" }}
                    maxH="calc(100dvh - 200px)"
                    w="auto"
                    h="auto"
                    objectFit="contain"
                    pointerEvents="none"
                    userSelect="none"
                    draggable={false}
                  />
                </Box>
              </Box>

              {count > 1 && (
                <IconButton
                  aria-label="Próxima imagem"
                  position="absolute"
                  right={{ base: 2, md: 4 }}
                  zIndex={2}
                  size="lg"
                  borderRadius="full"
                  bg="blackAlpha.500"
                  color="white"
                  _hover={{ bg: "blackAlpha.700" }}
                  onClick={goNext}
                >
                  <IoChevronForward size={28} />
                </IconButton>
              )}
            </Flex>
          </DialogBody>
        </DialogContent>
      </DialogRoot>
    </>
  );
};
