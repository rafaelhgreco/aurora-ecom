/**
 * Formulário de Cadastro de Produto
 *
 * Formulário completo com:
 * - Validação com Zod + React Hook Form
 * - Upload de imagens para Cloudinary
 * - Feedback visual de loading/sucesso/erro
 * - Integration com Server Actions
 */

"use client";

import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Flex,
  Grid,
  Heading,
  HStack,
  IconButton,
  Image,
  Input,
  Stack,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { IoClose, IoCloudUpload } from "react-icons/io5";
import { createProductAction } from "@/app/actions/products";
import { Alert } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
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
            <Card.Root>
              <Card.Header>
                <Heading size="lg">Dados Básicos</Heading>
              </Card.Header>
              <Card.Body>
                <Stack gap={4}>
                  {/* Título */}
                  <Field
                    label="Título *"
                    invalid={!!errors.title}
                    errorText={errors.title?.message}
                  >
                    <Input
                      {...register("title")}
                      placeholder="Ex: Camiseta Básica"
                    />
                  </Field>

                  {/* Subtítulo */}
                  <Field
                    label="Subtítulo"
                    invalid={!!errors.subtitle}
                    errorText={errors.subtitle?.message}
                  >
                    <Input
                      {...register("subtitle")}
                      placeholder="Ex: 100% Algodão"
                    />
                  </Field>

                  {/* Descrição */}
                  <Field
                    label="Descrição *"
                    invalid={!!errors.description}
                    errorText={errors.description?.message}
                  >
                    <Textarea
                      {...register("description")}
                      placeholder="Descreva o produto..."
                      rows={4}
                    />
                  </Field>

                  {/* Categoria */}
                  <Field
                    label="Categoria *"
                    invalid={!!errors.category}
                    errorText={errors.category?.message}
                  >
                    <Input
                      {...register("category")}
                      placeholder="Ex: Camisetas"
                    />
                  </Field>
                </Stack>
              </Card.Body>
            </Card.Root>

            {/* === PREÇO E ESTOQUE === */}
            <Card.Root>
              <Card.Header>
                <Heading size="lg">Preço e Estoque</Heading>
              </Card.Header>
              <Card.Body>
                <Grid
                  templateColumns="repeat(auto-fit, minmax(200px, 1fr))"
                  gap={4}
                >
                  {/* Preço */}
                  <Field
                    label="Preço (R$) *"
                    invalid={!!errors.price}
                    errorText={errors.price?.message}
                  >
                    <Input
                      {...register("price", { valueAsNumber: true })}
                      type="number"
                      step="0.01"
                      placeholder="99.90"
                    />
                  </Field>

                  {/* Estoque */}
                  <Field
                    label="Estoque *"
                    invalid={!!errors.stock}
                    errorText={errors.stock?.message}
                  >
                    <Input
                      {...register("stock", { valueAsNumber: true })}
                      type="number"
                      placeholder="100"
                    />
                  </Field>
                </Grid>
              </Card.Body>
            </Card.Root>

            {/* === TAMANHOS === */}
            <Card.Root>
              <Card.Header>
                <Heading size="lg">Tamanhos / variações *</Heading>
              </Card.Header>
              <Card.Body>
                <HStack flexWrap="wrap" gap={2} mb={3}>
                  <Button
                    type="button"
                    size="sm"
                    variant={sizePreset === "clothing" ? "solid" : "outline"}
                    onClick={() => applySizePreset("clothing")}
                  >
                    Roupas
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={sizePreset === "volume" ? "solid" : "outline"}
                    onClick={() => applySizePreset("volume")}
                  >
                    Volumes (ml)
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={sizePreset === "custom" ? "solid" : "outline"}
                    onClick={() => applySizePreset("custom")}
                  >
                    Personalizado
                  </Button>
                </HStack>
                {sizePreset !== "custom" ? (
                  <Flex gap={4} wrap="wrap">
                    {presetOptions.map((size) => (
                      <Checkbox
                        key={size}
                        checked={selectedSizes.includes(size)}
                        onCheckedChange={() => handleToggleSize(size)}
                      >
                        {size}
                      </Checkbox>
                    ))}
                  </Flex>
                ) : (
                  <Stack gap={3}>
                    <HStack flexWrap="wrap" gap={2}>
                      <Input
                        maxLength={32}
                        placeholder="Ex.: 30ml"
                        value={customSizeDraft}
                        onChange={(e) => setCustomSizeDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddCustomSize();
                          }
                        }}
                        maxW="280px"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAddCustomSize}
                      >
                        Adicionar
                      </Button>
                    </HStack>
                    <Flex flexWrap="wrap" gap={2}>
                      {(selectedSizes || []).map((s) => (
                        <HStack
                          key={s}
                          bg="gray.100"
                          borderRadius="md"
                          px={2}
                          py={1}
                          gap={1}
                        >
                          <Text fontSize="sm">{s}</Text>
                          <IconButton
                            aria-label={`Remover ${s}`}
                            size="2xs"
                            variant="ghost"
                            onClick={() => handleRemoveCustomSize(s)}
                          >
                            <IoClose />
                          </IconButton>
                        </HStack>
                      ))}
                    </Flex>
                  </Stack>
                )}
                {errors.sizes && (
                  <Text color="red.500" fontSize="sm" mt={2}>
                    {errors.sizes.message}
                  </Text>
                )}
              </Card.Body>
            </Card.Root>

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
