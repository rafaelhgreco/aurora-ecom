"use client";
"use no memo";

import {
  Accordion,
  Box,
  Button,
  Card,
  Flex,
  Grid,
  Heading,
  HStack,
  IconButton,
  Image,
  Input,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useEffect, useId, useRef, useState } from "react";
import {
  IoAdd,
  IoCamera,
  IoChevronDown,
  IoClose,
  IoCloudUpload,
} from "react-icons/io5";
import { ProgressBar, ProgressRoot } from "@/components/ui/progress";
import type { ProductSize } from "@/core/schemas/product.schema";
import { CameraPhotoCapture } from "../camera-photo-capture";
import {
  type ColorEditRow,
  MAX_COLORS,
  MAX_IMAGES_PER_COLOR,
} from "./use-color-variant-rows";

/** Resumo exibido no cabeçalho (fechado) do accordion de cada cor. */
function summarizeColorRow(
  row: ColorEditRow,
  selectedSizes: ProductSize[],
): string {
  const photoCount = row.existingUrls.length + row.previews.length;
  const photoLabel = `${photoCount} foto${photoCount === 1 ? "" : "s"}`;
  if (selectedSizes.length === 0) return photoLabel;
  const withStock = selectedSizes.filter(
    (s) => (row.stockBySize[s] ?? 0) > 0,
  ).length;
  return `${photoLabel} • ${withStock}/${selectedSizes.length} tamanhos com estoque`;
}

interface ProductColorVariantsCardProps {
  colorRows: ColorEditRow[];
  selectedSizes: ProductSize[];
  /** Quando falso, esconde nome/remoção/adição de cor — o card vira uma
   *  galeria de fotos única (ver item 7: produto sem variação de cor). */
  hasColorVariation: boolean;
  isUploading: boolean;
  uploadProgress: Record<number, number>;
  addColorRow: () => void;
  removeColorRow: (rowIndex: number) => void;
  setRowColor: (rowIndex: number, color: string) => void;
  addRowImageFiles: (rowIndex: number, files: File[]) => void;
  removeExistingUrl: (rowIndex: number, imageIndex: number) => void;
  removeNewFile: (rowIndex: number, imageIndex: number) => void;
  setRowStock: (rowIndex: number, size: ProductSize, quantity: number) => void;
}

export function ProductColorVariantsCard({
  colorRows,
  selectedSizes,
  hasColorVariation,
  isUploading,
  uploadProgress,
  addColorRow,
  removeColorRow,
  setRowColor,
  addRowImageFiles,
  removeExistingUrl,
  removeNewFile,
  setRowStock,
}: ProductColorVariantsCardProps) {
  const colorFileInputId = useId();
  const [cameraCaptureRowIndex, setCameraCaptureRowIndex] = useState<
    number | null
  >(null);

  /** Nasce vazio (tudo colapsado); novas cores se auto-expandem sem fechar as demais. */
  const [openColorIds, setOpenColorIds] = useState<string[]>([]);
  const prevRowIdsRef = useRef<string[]>(colorRows.map((r) => r.id));
  useEffect(() => {
    const prevIds = prevRowIdsRef.current;
    const newIds = colorRows
      .map((r) => r.id)
      .filter((id) => !prevIds.includes(id));
    if (newIds.length > 0) {
      setOpenColorIds((prev) => [...prev, ...newIds]);
    }
    prevRowIdsRef.current = colorRows.map((r) => r.id);
  }, [colorRows]);

  const handleRowImageSelect = (
    rowIndex: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    addRowImageFiles(rowIndex, Array.from(e.target.files || []));
    e.target.value = "";
  };

  const renderColorNameField = (row: ColorEditRow, rowIndex: number) => (
    <Flex
      direction={{ base: "column", sm: "row" }}
      justify="space-between"
      align={{ base: "stretch", sm: "flex-end" }}
      gap={3}
      mb={4}
    >
      <Box flex={1}>
        <Text fontWeight="medium" mb={1} fontSize="sm">
          Nome da cor
        </Text>
        <Input
          value={row.color}
          onChange={(e) => setRowColor(rowIndex, e.target.value)}
          placeholder="Ex.: Branco, Preto"
          size="md"
        />
      </Box>
      {colorRows.length > 1 && (
        <Button
          type="button"
          size="md"
          variant="outline"
          colorScheme="red"
          width={{ base: "full", sm: "auto" }}
          flexShrink={0}
          onClick={() => removeColorRow(rowIndex)}
        >
          Remover cor
        </Button>
      )}
    </Flex>
  );

  const renderRowBody = (row: ColorEditRow, rowIndex: number) => (
    <>
      <Stack direction={{ base: "column", sm: "row" }} gap={2}>
        <Input
          type="file"
          accept="image/*"
          multiple
          display="none"
          id={`${colorFileInputId}-color-upload-${row.id}`}
          onChange={(e) => handleRowImageSelect(rowIndex, e)}
        />
        <label
          htmlFor={`${colorFileInputId}-color-upload-${row.id}`}
          style={{ flex: 1, display: "block" }}
        >
          <Button
            as="span"
            size="md"
            minH="48px"
            colorScheme="blue"
            variant="outline"
            width="full"
            cursor="pointer"
            disabled={
              row.existingUrls.length + row.files.length >=
                MAX_IMAGES_PER_COLOR || isUploading
            }
            type="button"
          >
            <HStack gap={2} justify="center">
              <IoCloudUpload />
              <Text>
                Adicionar fotos ({row.existingUrls.length + row.files.length}/
                {MAX_IMAGES_PER_COLOR})
              </Text>
            </HStack>
          </Button>
        </label>

        <Button
          size="lg"
          minH="56px"
          colorScheme="green"
          variant="solid"
          flex={1}
          width="full"
          disabled={
            row.existingUrls.length + row.files.length >=
              MAX_IMAGES_PER_COLOR || isUploading
          }
          type="button"
          onClick={() => setCameraCaptureRowIndex(rowIndex)}
          _active={{ transform: "scale(0.98)" }}
        >
          <HStack gap={2} justify="center">
            <IoCamera size={22} />
            <Text fontSize="md">Tirar foto</Text>
          </HStack>
        </Button>
      </Stack>

      {(row.existingUrls.length > 0 || row.previews.length > 0) && (
        <Grid
          templateColumns="repeat(auto-fill, minmax(150px, 1fr))"
          gap={4}
          mt={4}
        >
          {row.existingUrls.map((url, imgIndex) => (
            <Box key={`${row.id}-ex-${url}`} position="relative">
              <Image
                src={url}
                alt={`${row.color || "Cor"} ${imgIndex + 1}`}
                borderRadius="md"
                objectFit="cover"
                height="150px"
                width="100%"
              />
              <Box
                position="absolute"
                top={2}
                left={2}
                bg={imgIndex === 0 ? "green.500" : "blackAlpha.700"}
                color="white"
                fontSize="xs"
                px={2}
                py={1}
                borderRadius="sm"
              >
                {imgIndex === 0 ? "Capa" : `#${imgIndex + 1}`}
              </Box>
              <IconButton
                position="absolute"
                top={2}
                right={2}
                size="sm"
                colorScheme="red"
                onClick={() => removeExistingUrl(rowIndex, imgIndex)}
                aria-label="Remover imagem"
              >
                <IoClose />
              </IconButton>
            </Box>
          ))}
          {row.previews.map((preview, imgIndex) => (
            <Box key={preview} position="relative">
              <Image
                src={preview}
                alt={`Nova ${imgIndex + 1}`}
                borderRadius="md"
                objectFit="cover"
                height="150px"
                width="100%"
              />
              <Box
                position="absolute"
                top={2}
                left={2}
                bg="blackAlpha.700"
                color="white"
                fontSize="xs"
                px={2}
                py={1}
                borderRadius="sm"
              >
                Nova
              </Box>
              <IconButton
                position="absolute"
                top={2}
                right={2}
                size="sm"
                colorScheme="red"
                onClick={() => removeNewFile(rowIndex, imgIndex)}
                aria-label="Remover nova imagem"
              >
                <IoClose />
              </IconButton>
              {isUploading && uploadProgress[imgIndex] !== undefined && (
                <Box
                  position="absolute"
                  bottom={0}
                  left={0}
                  right={0}
                  p={2}
                  bg="blackAlpha.700"
                  borderBottomRadius="md"
                >
                  <ProgressRoot value={uploadProgress[imgIndex]} size="sm">
                    <ProgressBar />
                  </ProgressRoot>
                </Box>
              )}
            </Box>
          ))}
        </Grid>
      )}

      {selectedSizes.length > 0 && (
        <Box mt={4}>
          <Text fontWeight="semibold" mb={3} fontSize="sm">
            Estoque por tamanho (esta cor)
          </Text>
          <Flex gap={4} wrap="wrap">
            {selectedSizes.map((size) => (
              <HStack
                key={size}
                bg="gray.50"
                _dark={{ bg: "gray.800" }}
                px={4}
                py={2}
                borderRadius="md"
                gap={3}
              >
                <Text fontWeight="semibold" minW="2rem">
                  {size}
                </Text>
                <Input
                  aria-label={`Quantidade em estoque para ${size}`}
                  type="text"
                  inputMode="numeric"
                  size="sm"
                  w="4.5rem"
                  textAlign="center"
                  bg="white"
                  _dark={{ bg: "gray.900" }}
                  value={row.stockBySize[size] ?? 0}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "");
                    setRowStock(
                      rowIndex,
                      size,
                      digits === "" ? 0 : Number(digits),
                    );
                  }}
                />
              </HStack>
            ))}
          </Flex>
        </Box>
      )}
    </>
  );

  return (
    <Card.Root>
      <Card.Header>
        <Heading size="lg">
          {hasColorVariation ? "Cores e fotos" : "Fotos do produto"}
        </Heading>
        <Text color="gray.600" fontSize="sm">
          {hasColorVariation
            ? 'Cada cor tem nome e fotos próprias. A primeira foto de cada cor é a capa dessa variante. Com tamanhos selecionados em "Tamanhos", informe o estoque por tamanho em cada bloco de cor.'
            : 'A primeira foto é a capa do produto. Com tamanhos selecionados em "Tamanhos", informe o estoque por tamanho abaixo.'}
        </Text>
      </Card.Header>
      <Card.Body>
        <VStack gap={6} align="stretch">
          {hasColorVariation ? (
            <Accordion.Root
              multiple
              value={openColorIds}
              onValueChange={(details) => setOpenColorIds(details.value)}
              variant="outline"
            >
              {colorRows.map((row, rowIndex) => (
                <Accordion.Item key={row.id} value={row.id}>
                  <Accordion.ItemTrigger py={4} cursor="pointer">
                    <HStack flex="1" justify="space-between" pr={2} minW={0}>
                      <Text fontWeight="semibold" truncate>
                        {row.color.trim() || `Cor ${rowIndex + 1} (sem nome)`}
                      </Text>
                      <Text fontSize="sm" color="gray.500" flexShrink={0}>
                        {summarizeColorRow(row, selectedSizes)}
                      </Text>
                    </HStack>
                    <Accordion.ItemIndicator>
                      <IoChevronDown />
                    </Accordion.ItemIndicator>
                  </Accordion.ItemTrigger>
                  <Accordion.ItemContent>
                    <Accordion.ItemBody>
                      {renderColorNameField(row, rowIndex)}
                      {renderRowBody(row, rowIndex)}
                    </Accordion.ItemBody>
                  </Accordion.ItemContent>
                </Accordion.Item>
              ))}
            </Accordion.Root>
          ) : (
            colorRows.map((row, rowIndex) => (
              <Box
                key={row.id}
                p={4}
                borderWidth="1px"
                borderRadius="md"
                borderColor="gray.200"
              >
                {renderRowBody(row, rowIndex)}
              </Box>
            ))
          )}

          {hasColorVariation && (
            <Button
              type="button"
              variant="outline"
              onClick={addColorRow}
              disabled={colorRows.length >= MAX_COLORS || isUploading}
            >
              <HStack gap={2}>
                <IoAdd />
                <Text>Adicionar outra cor</Text>
              </HStack>
            </Button>
          )}
        </VStack>

        <CameraPhotoCapture
          open={cameraCaptureRowIndex !== null}
          onClose={() => setCameraCaptureRowIndex(null)}
          onCapture={(file) => {
            if (cameraCaptureRowIndex !== null) {
              addRowImageFiles(cameraCaptureRowIndex, [file]);
            }
            setCameraCaptureRowIndex(null);
          }}
        />
      </Card.Body>
    </Card.Root>
  );
}
