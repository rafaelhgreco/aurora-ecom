/**
 * Formulário de edição de produto (Firestore) — alinhado a schemas e use case de update.
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
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  IoAddOutline,
  IoArrowBack,
  IoClose,
  IoCloudUpload,
  IoRemoveOutline,
} from "react-icons/io5";
import { updateProductAction } from "@/app/actions/products";
import type { Product } from "@/app/types/product";
import { Alert } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { ProgressBar, ProgressRoot } from "@/components/ui/progress";
import { toaster } from "@/components/ui/toaster";
import {
  SHOP_CATEGORY_IDS,
  SHOP_CATEGORY_LABELS,
  type ShopCategoryId,
} from "@/core/catalog/shop-catalog";
import {
  PRODUCT_SIZES,
  type ProductAdminEditFormValues,
  type ProductSize,
  productAdminEditFormSchema,
  type UpdateProductInput,
} from "@/core/schemas/product.schema";
import { uploadMultipleFiles } from "@/infrastructure/lib/cloudinary.service";

function parseColorsText(text: string | undefined): string[] | undefined {
  if (!text?.trim()) return undefined;
  const parts = text
    .split(",")
    .map((c) => c.trim())
    .filter((c) => c.length >= 2 && c.length <= 30);
  return parts.length > 0 ? parts : undefined;
}

function productToFormDefaults(product: Product): ProductAdminEditFormValues {
  const sizes = product.sizes ?? [];
  const stockBySize =
    product.stockBySize ??
    (sizes.length > 0
      ? Object.fromEntries(
          sizes.map((s, i) => [s, i === 0 ? (product.stock ?? 0) : 0]),
        )
      : undefined);
  return {
    id: product.id || "",
    title: product.title,
    subtitle: product.subtitle ?? "",
    description: product.description,
    price: product.price,
    stock: product.stock,
    stockBySize,
    category: product.category ?? "",
    shopCategory: (product.shopCategory ?? "roupas") as ShopCategoryId,
    sizes,
    isActive: product.isActive ?? true,
    colorsText: product.colors?.join(", ") ?? "",
  };
}

interface ProductEditFormProps {
  product: Product;
}

export function ProductEditForm({ product }: ProductEditFormProps) {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<number, number>>(
    {},
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [existingUrls, setExistingUrls] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);

  const defaults = useMemo(() => productToFormDefaults(product), [product]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
    getValues,
  } = useForm<ProductAdminEditFormValues>({
    // biome-ignore lint/suspicious/noExplicitAny: zodResolver type compatibility
    resolver: zodResolver(productAdminEditFormSchema) as any,
    defaultValues: defaults,
  });

  const selectedSizes = watch("sizes") || [];
  const stockBySize = watch("stockBySize") ?? {};

  useEffect(() => {
    if (selectedSizes.length === 0) return;
    const current = getValues("stockBySize") ?? {};
    let changed = false;
    const next = { ...current };
    for (const s of selectedSizes) {
      if (!(s in next)) {
        next[s as ProductSize] = 0;
        changed = true;
      }
    }
    if (changed) setValue("stockBySize", next);
  }, [selectedSizes, setValue, getValues]);

  const adjustStockBySize = (size: ProductSize, delta: number) => {
    const prev = stockBySize[size as keyof typeof stockBySize] ?? 0;
    const next = Math.max(0, prev + delta);
    setValue("stockBySize", { ...stockBySize, [size]: next });
  };

  useEffect(() => {
    reset(defaults);
    setExistingUrls(
      product.images?.length
        ? [...product.images]
        : product.imageUrl
          ? [product.imageUrl]
          : [],
    );
    setNewFiles([]);
    setNewPreviews([]);
  }, [product, defaults, reset]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const maxTotal = 10;
    const room = maxTotal - existingUrls.length - newFiles.length;
    if (room <= 0) return;

    const toAdd = files.slice(0, room);
    const previews = toAdd.map((f) => URL.createObjectURL(f));
    setNewFiles((prev) => [...prev, ...toAdd]);
    setNewPreviews((prev) => [...prev, ...previews]);
  };

  const removeExistingUrl = (index: number) => {
    setExistingUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewFile = (index: number) => {
    URL.revokeObjectURL(newPreviews[index]);
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
    setNewPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleToggleSize = (size: ProductSize) => {
    const current = selectedSizes || [];
    const next = current.includes(size)
      ? current.filter((s) => s !== size)
      : [...current, size];
    setValue("sizes", next);
  };

  const handleUploadNewFiles = async (): Promise<string[]> => {
    if (newFiles.length === 0) return [];
    setIsUploading(true);
    setUploadProgress({});
    try {
      return (
        await uploadMultipleFiles(
          newFiles,
          "products/images",
          (fileIndex, progress) => {
            setUploadProgress((prev) => ({
              ...prev,
              [fileIndex]: progress.progress,
            }));
          },
        )
      ).map((r) => r.url);
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: ProductAdminEditFormValues) => {
    setSubmitStatus(null);

    const mergedImages = [...existingUrls];
    if (mergedImages.length === 0 && newFiles.length === 0) {
      setSubmitStatus({
        type: "error",
        message: "Mantenha ao menos uma imagem ou envie novas.",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const uploaded = await handleUploadNewFiles();
      const allImages = [...mergedImages, ...uploaded];

      if (allImages.length === 0) {
        setSubmitStatus({
          type: "error",
          message: "É necessário ao menos uma imagem.",
        });
        return;
      }

      const colors = parseColorsText(data.colorsText);

      const payload: UpdateProductInput = {
        id: data.id,
        title: data.title,
        subtitle: data.subtitle || undefined,
        description: data.description,
        price: data.price,
        stock: data.stock,
        stockBySize:
          data.stockBySize && Object.keys(data.stockBySize).length > 0
            ? data.stockBySize
            : undefined,
        category: data.category || undefined,
        shopCategory: data.shopCategory,
        imageUrl: allImages[0],
        images: allImages,
        sizes: data.sizes?.length ? data.sizes : undefined,
        colors,
        isActive: data.isActive,
      };

      const result = await updateProductAction(payload);

      if (result.success) {
        toaster.create({
          title: "Produto atualizado",
          description: "As alterações foram salvas no Firestore.",
          type: "success",
          duration: 4000,
        });
        setNewFiles([]);
        setNewPreviews([]);
        setExistingUrls(allImages);
        router.push("/admin-produtos");
        router.refresh();
      } else {
        setSubmitStatus({
          type: "error",
          message: result.error || "Erro ao atualizar produto",
        });
      }
    } catch (err) {
      setSubmitStatus({
        type: "error",
        message: err instanceof Error ? err.message : "Erro desconhecido",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxW="container.lg" py={8}>
      <VStack gap={6} align="stretch">
        <HStack justify="space-between" flexWrap="wrap" gap={4}>
          <Button
            variant="ghost"
            onClick={() => router.push("/admin-produtos")}
            size="sm"
          >
            <IoArrowBack style={{ marginRight: 8 }} />
            Voltar
          </Button>
        </HStack>

        <Box>
          <Heading size="2xl">Editar produto</Heading>
          <Text color="gray.600" mt={2}>
            Atualize dados, imagens, estoque e disponibilidade na loja.
          </Text>
        </Box>

        {submitStatus && (
          <Alert
            status={submitStatus.type}
            title={submitStatus.type === "success" ? "Sucesso" : "Erro"}
          >
            {submitStatus.message}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <Input type="hidden" {...register("id")} />
          <VStack gap={6} align="stretch">
            <Card.Root>
              <Card.Header>
                <Heading size="lg">Imagens</Heading>
                <Text color="gray.600" fontSize="sm">
                  Primeira imagem é a capa. Até 10 no total.
                </Text>
              </Card.Header>
              <Card.Body>
                <VStack gap={4} align="stretch">
                  <Box>
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageSelect}
                      display="none"
                      id="edit-image-upload"
                    />
                    <label htmlFor="edit-image-upload">
                      <Button
                        as="span"
                        colorScheme="blue"
                        variant="outline"
                        width="full"
                        cursor="pointer"
                      >
                        <IoCloudUpload style={{ marginRight: 8 }} />
                        Adicionar imagens (
                        {existingUrls.length + newFiles.length}/10)
                      </Button>
                    </label>
                  </Box>

                  {(existingUrls.length > 0 || newPreviews.length > 0) && (
                    <Grid
                      templateColumns="repeat(auto-fill, minmax(150px, 1fr))"
                      gap={4}
                    >
                      {existingUrls.map((url, index) => (
                        <Box key={url} position="relative">
                          <Image
                            src={url}
                            alt={`Imagem ${index + 1}`}
                            borderRadius="md"
                            objectFit="cover"
                            height="150px"
                            width="100%"
                          />
                          <Badge
                            position="absolute"
                            top={2}
                            left={2}
                            colorScheme={index === 0 ? "green" : "gray"}
                          >
                            {index === 0 ? "Principal" : `#${index + 1}`}
                          </Badge>
                          <IconButton
                            position="absolute"
                            top={2}
                            right={2}
                            size="sm"
                            colorScheme="red"
                            onClick={() => removeExistingUrl(index)}
                            aria-label="Remover imagem"
                          >
                            <IoClose />
                          </IconButton>
                        </Box>
                      ))}
                      {newPreviews.map((preview, index) => (
                        <Box key={`n-${preview}`} position="relative">
                          <Image
                            src={preview}
                            alt={`Nova ${index + 1}`}
                            borderRadius="md"
                            objectFit="cover"
                            height="150px"
                            width="100%"
                          />
                          <Badge position="absolute" top={2} left={2}>
                            Nova
                          </Badge>
                          <IconButton
                            position="absolute"
                            top={2}
                            right={2}
                            size="sm"
                            colorScheme="red"
                            onClick={() => removeNewFile(index)}
                            aria-label="Remover nova imagem"
                          >
                            <IoClose />
                          </IconButton>
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
                              </Box>
                            )}
                        </Box>
                      ))}
                    </Grid>
                  )}
                </VStack>
              </Card.Body>
            </Card.Root>

            <Card.Root>
              <Card.Header>
                <Heading size="lg">Dados básicos</Heading>
              </Card.Header>
              <Card.Body>
                <Stack gap={4}>
                  <Field
                    label="Título *"
                    invalid={!!errors.title}
                    errorText={errors.title?.message}
                  >
                    <Input {...register("title")} />
                  </Field>
                  <Field
                    label="Subtítulo"
                    invalid={!!errors.subtitle}
                    errorText={errors.subtitle?.message}
                  >
                    <Input {...register("subtitle")} />
                  </Field>
                  <Field
                    label="Descrição *"
                    invalid={!!errors.description}
                    errorText={errors.description?.message}
                  >
                    <Textarea {...register("description")} rows={4} />
                  </Field>
                  <Field
                    label="Categoria"
                    invalid={!!errors.category}
                    errorText={errors.category?.message}
                  >
                    <Input
                      {...register("category")}
                      placeholder="Ex: camisetas"
                    />
                  </Field>
                  <Field
                    label="Seção do catálogo (loja)"
                    helperText="Define em qual página /shop/... o produto aparece."
                    invalid={!!errors.shopCategory}
                    errorText={errors.shopCategory?.message}
                  >
                    <Box
                      as="select"
                      borderWidth="1px"
                      borderRadius="md"
                      px={3}
                      py={2}
                      w="full"
                      bg="white"
                      {...register("shopCategory")}
                    >
                      {SHOP_CATEGORY_IDS.map((id) => (
                        <option key={id} value={id}>
                          {SHOP_CATEGORY_LABELS[id]}
                        </option>
                      ))}
                    </Box>
                  </Field>
                  <Field
                    label="Cores (opcional)"
                    helperText="Separe por vírgula, ex: Preto, Branco"
                    invalid={!!errors.colorsText}
                    errorText={errors.colorsText?.message}
                  >
                    <Input {...register("colorsText")} />
                  </Field>
                </Stack>
              </Card.Body>
            </Card.Root>

            <Card.Root>
              <Card.Header>
                <Heading size="lg">Preço e estoque</Heading>
              </Card.Header>
              <Card.Body>
                <Stack gap={4}>
                  <Field
                    label="Preço (R$) *"
                    invalid={!!errors.price}
                    errorText={errors.price?.message}
                  >
                    <Input
                      {...register("price", { valueAsNumber: true })}
                      type="number"
                      step="0.01"
                    />
                  </Field>
                  {selectedSizes.length > 0 ? (
                    <Box>
                      <Text fontWeight="medium" mb={3}>
                        Estoque por tamanho
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
                              aria-label={`Diminuir ${size}`}
                              size="sm"
                              variant="outline"
                              onClick={() => adjustStockBySize(size, -1)}
                            >
                              <IoRemoveOutline />
                            </IconButton>
                            <Text minW="2rem" textAlign="center">
                              {stockBySize[size as keyof typeof stockBySize] ??
                                0}
                            </Text>
                            <IconButton
                              aria-label={`Aumentar ${size}`}
                              size="sm"
                              variant="outline"
                              onClick={() => adjustStockBySize(size, 1)}
                            >
                              <IoAddOutline />
                            </IconButton>
                          </HStack>
                        ))}
                      </Flex>
                    </Box>
                  ) : (
                    <Field
                      label="Estoque *"
                      invalid={!!errors.stock}
                      errorText={errors.stock?.message}
                    >
                      <Input
                        {...register("stock", { valueAsNumber: true })}
                        type="number"
                      />
                    </Field>
                  )}
                </Stack>
              </Card.Body>
            </Card.Root>

            <Card.Root>
              <Card.Header>
                <Heading size="lg">Tamanhos *</Heading>
              </Card.Header>
              <Card.Body>
                <Flex gap={4} wrap="wrap">
                  {PRODUCT_SIZES.map((size) => (
                    <Checkbox
                      key={size}
                      checked={selectedSizes.includes(size)}
                      onCheckedChange={() => handleToggleSize(size)}
                    >
                      {size}
                    </Checkbox>
                  ))}
                </Flex>
                {errors.sizes && (
                  <Text color="red.500" fontSize="sm" mt={2}>
                    {errors.sizes.message}
                  </Text>
                )}
              </Card.Body>
            </Card.Root>

            <HStack justify="flex-end" gap={4}>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin-produtos")}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                colorScheme="blue"
                loading={isSubmitting || isUploading}
              >
                Salvar alterações
              </Button>
            </HStack>
          </VStack>
        </form>
      </VStack>
    </Container>
  );
}
