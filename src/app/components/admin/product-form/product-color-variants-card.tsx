"use client";
"use no memo";

import {
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
  Text,
  VStack,
} from "@chakra-ui/react";
import { useId, useState } from "react";
import {
  IoAdd,
  IoAddOutline,
  IoCamera,
  IoClose,
  IoCloudUpload,
  IoRemoveOutline,
} from "react-icons/io5";
import { ProgressBar, ProgressRoot } from "@/components/ui/progress";
import type { ProductSize } from "@/core/schemas/product.schema";
import { CameraPhotoCapture } from "../camera-photo-capture";
import {
  type ColorEditRow,
  MAX_COLORS,
  MAX_IMAGES_PER_COLOR,
} from "./use-color-variant-rows";

interface ProductColorVariantsCardProps {
  colorRows: ColorEditRow[];
  selectedSizes: ProductSize[];
  isUploading: boolean;
  uploadProgress: Record<number, number>;
  addColorRow: () => void;
  removeColorRow: (rowIndex: number) => void;
  setRowColor: (rowIndex: number, color: string) => void;
  addRowImageFiles: (rowIndex: number, files: File[]) => void;
  removeExistingUrl: (rowIndex: number, imageIndex: number) => void;
  removeNewFile: (rowIndex: number, imageIndex: number) => void;
  adjustRowStock: (rowIndex: number, size: ProductSize, delta: number) => void;
}

export function ProductColorVariantsCard({
  colorRows,
  selectedSizes,
  isUploading,
  uploadProgress,
  addColorRow,
  removeColorRow,
  setRowColor,
  addRowImageFiles,
  removeExistingUrl,
  removeNewFile,
  adjustRowStock,
}: ProductColorVariantsCardProps) {
  const colorFileInputId = useId();
  const [cameraCaptureRowIndex, setCameraCaptureRowIndex] = useState<
    number | null
  >(null);

  const handleRowImageSelect = (
    rowIndex: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    addRowImageFiles(rowIndex, Array.from(e.target.files || []));
    e.target.value = "";
  };

  return (
    <Card.Root>
      <Card.Header>
        <Heading size="lg">Cores e fotos</Heading>
        <Text color="gray.600" fontSize="sm">
          Cada cor tem nome e fotos próprias. A primeira foto de cada cor é a
          capa dessa variante. Com tamanhos selecionados em
          &quot;Tamanhos&quot;, informe o estoque por tamanho em cada bloco de
          cor.
        </Text>
      </Card.Header>
      <Card.Body>
        <VStack gap={6} align="stretch">
          {colorRows.map((row, rowIndex) => (
            <Box
              key={row.id}
              p={4}
              borderWidth="1px"
              borderRadius="md"
              borderColor="gray.200"
            >
              <HStack justify="space-between" mb={3} flexWrap="wrap">
                <Box maxW={{ base: "full", md: "280px" }} flex={1}>
                  <Text fontWeight="medium" mb={1} fontSize="sm">
                    Nome da cor
                  </Text>
                  <Input
                    value={row.color}
                    onChange={(e) => setRowColor(rowIndex, e.target.value)}
                    placeholder="Ex.: Branco, Preto"
                  />
                </Box>
                {colorRows.length > 1 && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    colorScheme="red"
                    onClick={() => removeColorRow(rowIndex)}
                  >
                    Remover cor
                  </Button>
                )}
              </HStack>

              <HStack gap={2}>
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
                  style={{ flex: 1 }}
                >
                  <Button
                    as="span"
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
                    <IoCloudUpload style={{ marginRight: 8 }} />
                    Adicionar fotos (
                    {row.existingUrls.length + row.files.length}/
                    {MAX_IMAGES_PER_COLOR})
                  </Button>
                </label>

                <Button
                  colorScheme="green"
                  variant="outline"
                  flex={1}
                  disabled={
                    row.existingUrls.length + row.files.length >=
                      MAX_IMAGES_PER_COLOR || isUploading
                  }
                  type="button"
                  onClick={() => setCameraCaptureRowIndex(rowIndex)}
                >
                  <IoCamera style={{ marginRight: 8 }} />
                  Tirar Foto
                </Button>
              </HStack>

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
                      {isUploading &&
                        uploadProgress[imgIndex] !== undefined && (
                          <Box
                            position="absolute"
                            bottom={0}
                            left={0}
                            right={0}
                            p={2}
                            bg="blackAlpha.700"
                            borderBottomRadius="md"
                          >
                            <ProgressRoot
                              value={uploadProgress[imgIndex]}
                              size="sm"
                            >
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
                        <IconButton
                          aria-label={`Menos ${size}`}
                          size="sm"
                          variant="outline"
                          type="button"
                          onClick={() => adjustRowStock(rowIndex, size, -1)}
                        >
                          <IoRemoveOutline />
                        </IconButton>
                        <Text minW="2rem" textAlign="center">
                          {row.stockBySize[size] ?? 0}
                        </Text>
                        <IconButton
                          aria-label={`Mais ${size}`}
                          size="sm"
                          variant="outline"
                          type="button"
                          onClick={() => adjustRowStock(rowIndex, size, 1)}
                        >
                          <IoAddOutline />
                        </IconButton>
                      </HStack>
                    ))}
                  </Flex>
                </Box>
              )}
            </Box>
          ))}

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
