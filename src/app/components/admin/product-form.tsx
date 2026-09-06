"use client";

import { ProductBasicDataCard } from "./product-form/product-basic-data-card";
import { ProductPriceStockCard } from "./product-form/product-price-stock-card";
import { ProductSizesCard } from "./product-form/product-sizes-card";

/**
 * Formulário de Cadastro de Produto
 *
 * Formulário completo com:
 * - Validação com Zod + React Hook Form
 * - Upload de imagens para Cloudinary
 * - Feedback visual de loading/sucesso/erro
 * - Integration com Server Actions
 */

import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Grid,
  Heading,
  HStack,
  IconButton,
  Image,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { IoClose, IoCloudUpload } from "react-icons/io5";
import { createProductAction } from "@/app/actions/products";
import { Alert } from "@/components/ui/alert";
import { ProgressBar, ProgressRoot } from "@/components/ui/progress";
import {
  type CreateProductInput,
  createProductSchema,
  PRODUCT_SIZES_CLOTHING,
  PRODUCT_SIZES_VOLUME,
  type ProductSize,
  type SizePresetKind,
} from "@/core/schemas/product.schema";
import { uploadMultipleFiles } from "@/infrastructure/lib/cloudinary.service";
import { ADMIN_GENERIC } from "@/shared/errors/client-error-messages";

export function ProductForm() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<number, number>>(
    {},
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [sizePreset, setSizePreset] = useState<SizePresetKind>("clothing");
  const [customSizeDraft, setCustomSizeDraft] = useState("");

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<CreateProductInput>({
    // biome-ignore lint/suspicious/noExplicitAny: zodResolver type compatibility
    resolver: zodResolver(createProductSchema) as any,
    defaultValues: {
      stock: 0,
      isActive: true,
      images: [],
    },
  });

  const selectedSizes = watch("sizes") || [];

  /**
   * Adiciona imagens selecionadas
   */
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (files.length === 0) return;

    const remainingSlots = 10 - imageFiles.length;
    const filesToAdd = files.slice(0, remainingSlots);

    const newPreviews = filesToAdd.map((file) => URL.createObjectURL(file));

    setImageFiles([...imageFiles, ...filesToAdd]);
    setImagePreviews([...imagePreviews, ...newPreviews]);
  };

  /**
   * Remove imagem
   */
  const handleRemoveImage = (index: number) => {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);

    URL.revokeObjectURL(imagePreviews[index]);

    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
  };

  /**
   * Faz upload das imagens
   */
  const handleUploadImages = async (): Promise<string[]> => {
    if (imageFiles.length === 0) {
      throw new Error("Selecione pelo menos uma imagem");
    }

    setIsUploading(true);
    setUploadProgress({});

    try {
      const results = await uploadMultipleFiles(
        imageFiles,
        "products/images",
        (fileIndex, progress) => {
          setUploadProgress((prev) => ({
            ...prev,
            [fileIndex]: progress.progress,
          }));
        },
      );

      const urls = results.map((r) => r.url);
      return urls;
    } finally {
      setIsUploading(false);
    }
  };

  const presetOptions =
    sizePreset === "clothing"
      ? PRODUCT_SIZES_CLOTHING
      : sizePreset === "volume"
        ? PRODUCT_SIZES_VOLUME
        : [];

  const applySizePreset = (next: SizePresetKind) => {
    if (next === sizePreset) return;
    setSizePreset(next);
    setValue("sizes", []);
    setCustomSizeDraft("");
  };

  const handleToggleSize = (size: ProductSize) => {
    const current = selectedSizes || [];
    const newSizes = current.includes(size)
      ? current.filter((s) => s !== size)
      : [...current, size];
    setValue("sizes", newSizes);
  };

  const handleAddCustomSize = () => {
    const t = customSizeDraft.trim();
    if (!t || t.length > 32) return;
    if (selectedSizes.includes(t)) return;
    setValue("sizes", [...(selectedSizes || []), t]);
    setCustomSizeDraft("");
  };

  const handleRemoveCustomSize = (size: string) => {
    setValue(
      "sizes",
      (selectedSizes || []).filter((s) => s !== size),
    );
  };

  /**
   * Submit do formulário
   */
  const onSubmit = async (data: CreateProductInput) => {
    try {
      setIsSubmitting(true);
      setSubmitStatus(null);

      const imageUrls = await handleUploadImages();

      const productData: CreateProductInput = {
        ...data,
        imageUrl: imageUrls[0],
        images: imageUrls,
      };

      const result = await createProductAction(productData);

      if (result.success) {
        setSubmitStatus({
          type: "success",
          message: "Produto cadastrado com sucesso!",
        });

        reset();
        setImageFiles([]);
        setImagePreviews([]);
      } else {
        setSubmitStatus({
          type: "error",
          message: result.error || "Erro ao cadastrar produto",
        });
      }
    } catch {
      setSubmitStatus({
        type: "error",
        message: ADMIN_GENERIC,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxW="container.lg" py={8}>
      <VStack gap={6} align="stretch">
        {/* Header */}
        <Box>
          <Heading size="2xl">Cadastrar Produto</Heading>
          <Text color="gray.600" mt={2}>
            Preencha os dados do produto e faça upload das imagens
          </Text>
        </Box>

        {/* Status Message */}
        {submitStatus && (
          <Alert
            status={submitStatus.type}
            title={submitStatus.type === "success" ? "Sucesso!" : "Erro"}
          >
            {submitStatus.message}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <VStack gap={6} align="stretch">
            {/* === SEÇÃO DE UPLOAD === */}
            <Card.Root>
              <Card.Header>
                <Heading size="lg">Imagens do Produto</Heading>
                <Text color="gray.600" fontSize="sm">
                  Selecione até 10 imagens (a primeira será a principal)
                </Text>
              </Card.Header>
              <Card.Body>
                <VStack gap={4} align="stretch">
                  {/* Botão de Seleção */}
                  <Box>
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageSelect}
                      display="none"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload">
                      <Button
                        as="span"
                        colorScheme="blue"
                        variant="outline"
                        width="full"
                        cursor="pointer"
                      >
                        <IoCloudUpload style={{ marginRight: "8px" }} />
                        Selecionar Imagens ({imageFiles.length}/10)
                      </Button>
                    </label>
                  </Box>

                  {/* Preview das Imagens */}
                  {imagePreviews.length > 0 && (
                    <Grid
                      templateColumns="repeat(auto-fill, minmax(150px, 1fr))"
                      gap={4}
                    >
                      {imagePreviews.map((preview, index) => (
                        <Box key={preview} position="relative">
                          <Image
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            borderRadius="md"
                            objectFit="cover"
                            height="150px"
                            width="100%"
                          />

                          {/* Badge da posição */}
                          <Badge
                            position="absolute"
                            top={2}
                            left={2}
                            colorScheme={index === 0 ? "green" : "gray"}
                          >
                            {index === 0 ? "Principal" : `#${index + 1}`}
                          </Badge>

                          {/* Botão Remover */}
                          <IconButton
                            position="absolute"
                            top={2}
                            right={2}
                            size="sm"
                            colorScheme="red"
                            onClick={() => handleRemoveImage(index)}
                            aria-label="Remover imagem"
                          >
                            <IoClose />
                          </IconButton>

                          {/* Progress Bar durante upload */}
                          {isUploading &&
                            uploadProgress[index] !== undefined && (
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
                                  value={uploadProgress[index]}
                                  size="sm"
                                >
                                  <ProgressBar />
                                </ProgressRoot>
                                <Text
                                  color="white"
                                  fontSize="xs"
                                  textAlign="center"
                                  mt={1}
                                >
                                  {Math.round(uploadProgress[index])}%
                                </Text>
                              </Box>
                            )}
                        </Box>
                      ))}
                    </Grid>
                  )}
                </VStack>
              </Card.Body>
            </Card.Root>

            {/* === DADOS BÁSICOS === */}
            <ProductBasicDataCard register={register} errors={errors} />

            {/* === PREÇO E ESTOQUE === */}
            <ProductPriceStockCard register={register} errors={errors} />

            {/* === TAMANHOS === */}
            <ProductSizesCard
              sizePreset={sizePreset}
              applySizePreset={applySizePreset}
              presetOptions={presetOptions}
              selectedSizes={selectedSizes}
              handleToggleSize={handleToggleSize}
              customSizeDraft={customSizeDraft}
              setCustomSizeDraft={setCustomSizeDraft}
              handleAddCustomSize={handleAddCustomSize}
              handleRemoveCustomSize={handleRemoveCustomSize}
              errors={errors}
            />

            {/* === BOTÕES === */}
            <HStack justify="flex-end" gap={4}>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  reset();
                  setImageFiles([]);
                  setImagePreviews([]);
                }}
              >
                Limpar
              </Button>
              <Button
                type="submit"
                colorScheme="blue"
                loading={isSubmitting || isUploading}
                disabled={imageFiles.length === 0}
              >
                {isUploading ? "Fazendo Upload..." : "Cadastrar Produto"}
              </Button>
            </HStack>
          </VStack>
        </form>
      </VStack>
    </Container>
  );
}
