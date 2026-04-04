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
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import {
  IoAdd,
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
import type { ProductColorVariant } from "@/core/schemas/product.schema";
import {
  PRODUCT_SIZES,
  type ProductAdminEditFormValues,
  type ProductSize,
  productAdminEditFormSchema,
  type UpdateProductInput,
} from "@/core/schemas/product.schema";
import { uploadMultipleFiles } from "@/infrastructure/lib/cloudinary.service";
import { buildVariantStockBySize } from "@/shared/admin-product-stock";

const MAX_COLORS_EDIT = 12;
const MAX_IMAGES_PER_COLOR_EDIT = 10;

/** Referência estável: evita `|| []` novo a cada render (loop em useEffect). */
const EMPTY_SIZES: ProductSize[] = [];

type ColorEditRow = {
  id: string;
  color: string;
  existingUrls: string[];
  files: File[];
  previews: string[];
  stockBySize: Partial<Record<ProductSize, number>>;
};

function productToFormDefaults(product: Product): ProductAdminEditFormValues {
  const sizes = product.sizes ?? [];
  const hasPerColorStock = product.colorVariants?.some(
    (v) => v.stockBySize && Object.keys(v.stockBySize).length > 0,
  );
  const stockBySize = hasPerColorStock
    ? {}
    : (product.stockBySize ??
      (sizes.length > 0
        ? Object.fromEntries(
            sizes.map((s, i) => [s, i === 0 ? (product.stock ?? 0) : 0]),
          )
        : undefined));
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
    colorsText: "",
  };
}

function buildColorRowsFromProduct(product: Product): ColorEditRow[] {
  if (product.colorVariants?.length) {
    return product.colorVariants.map((v, i) => ({
      id: String(i),
      color: v.color,
      existingUrls: [...v.images],
      files: [],
      previews: [],
      stockBySize: { ...(v.stockBySize ?? {}) },
    }));
  }
  const urls =
    product.images?.length > 0
      ? [...product.images]
      : product.imageUrl
        ? [product.imageUrl]
        : [];
  const sizes = product.sizes ?? [];
  const sb = product.stockBySize ?? {};
  const stockBySize: Partial<Record<ProductSize, number>> = {};
  for (const s of sizes) {
    stockBySize[s] = sb[s] ?? 0;
  }
  return [
    {
      id: "0",
      color: "Padrão",
      existingUrls: urls,
      files: [],
      previews: [],
      stockBySize,
    },
  ];
}

interface ProductEditFormProps {
  product: Product;
}

export function ProductEditForm({ product }: ProductEditFormProps) {
  const router = useRouter();
  const colorFileInputId = useId();
  /** Próximo id ao adicionar cor; alinhado a buildColorRowsFromProduct (0..n-1). */
  const nextColorRowIdRef = useRef(0);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<number, number>>(
    {},
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [colorRows, setColorRows] = useState<ColorEditRow[]>(() => {
    const rows = buildColorRowsFromProduct(product);
    nextColorRowIdRef.current = rows.length;
    return rows;
  });

  const defaults = useMemo(() => productToFormDefaults(product), [product]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<ProductAdminEditFormValues>({
    // biome-ignore lint/suspicious/noExplicitAny: zodResolver type compatibility
    resolver: zodResolver(productAdminEditFormSchema) as any,
    defaultValues: defaults,
  });

  const rawSizes = watch("sizes");
  /** `?? EMPTY_SIZES` evita `|| []` (novo array a cada render → loop no useEffect abaixo). */
  const selectedSizes = rawSizes ?? EMPTY_SIZES;

  useEffect(() => {
    setColorRows((prev) =>
      prev.map((row) => {
        const next = { ...row.stockBySize };
        for (const s of selectedSizes) {
          if (!(s in next)) next[s] = 0;
        }
        for (const k of Object.keys(next)) {
          if (!selectedSizes.includes(k as ProductSize)) {
            delete next[k as ProductSize];
          }
        }
        return { ...row, stockBySize: next };
      }),
    );
  }, [selectedSizes]);

  useEffect(() => {
    if (selectedSizes.length > 0) {
      setValue("stockBySize", {});
    }
  }, [selectedSizes.length, setValue]);

  const adjustRowStock = (
    rowIndex: number,
    size: ProductSize,
    delta: number,
  ) => {
    setColorRows((prev) =>
      prev.map((r, i) => {
        if (i !== rowIndex) return r;
        const prevQty = r.stockBySize[size] ?? 0;
        return {
          ...r,
          stockBySize: {
            ...r.stockBySize,
            [size]: Math.max(0, prevQty + delta),
          },
        };
      }),
    );
  };

  useEffect(() => {
    reset(defaults);
    const rows = buildColorRowsFromProduct(product);
    nextColorRowIdRef.current = rows.length;
    setColorRows(rows);
  }, [product, defaults, reset]);

  const addColorRow = () => {
    if (colorRows.length >= MAX_COLORS_EDIT) return;
    const stockBySize: Partial<Record<ProductSize, number>> = {};
    for (const s of selectedSizes) {
      stockBySize[s] = 0;
    }
    setColorRows((prev) => [
      ...prev,
      {
        id: String(nextColorRowIdRef.current++),
        color: "",
        existingUrls: [],
        files: [],
        previews: [],
        stockBySize,
      },
    ]);
  };

  const removeColorRow = (rowIndex: number) => {
    if (colorRows.length <= 1) return;
    setColorRows((prev) => {
      const row = prev[rowIndex];
      for (const p of row.previews) {
        URL.revokeObjectURL(p);
      }
      return prev.filter((_, i) => i !== rowIndex);
    });
  };

  const setRowColor = (rowIndex: number, color: string) => {
    setColorRows((prev) =>
      prev.map((r, i) => (i === rowIndex ? { ...r, color } : r)),
    );
  };

  const handleRowImageSelect = (
    rowIndex: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setColorRows((prev) => {
      const row = prev[rowIndex];
      const room =
        MAX_IMAGES_PER_COLOR_EDIT - row.existingUrls.length - row.files.length;
      if (room <= 0) return prev;
      const toAdd = files.slice(0, room);
      const newPreviews = toAdd.map((f) => URL.createObjectURL(f));
      return prev.map((r, i) =>
        i === rowIndex
          ? {
              ...r,
              files: [...r.files, ...toAdd],
              previews: [...r.previews, ...newPreviews],
            }
          : r,
      );
    });
    e.target.value = "";
  };

  const removeExistingUrl = (rowIndex: number, imageIndex: number) => {
    setColorRows((prev) =>
      prev.map((r, i) =>
        i === rowIndex
          ? {
              ...r,
              existingUrls: r.existingUrls.filter((_, j) => j !== imageIndex),
            }
          : r,
      ),
    );
  };

  const removeNewFile = (rowIndex: number, imageIndex: number) => {
    setColorRows((prev) =>
      prev.map((r, i) => {
        if (i !== rowIndex) return r;
        URL.revokeObjectURL(r.previews[imageIndex]);
        return {
          ...r,
          files: r.files.filter((_, j) => j !== imageIndex),
          previews: r.previews.filter((_, j) => j !== imageIndex),
        };
      }),
    );
  };

  const handleToggleSize = (size: ProductSize) => {
    const current = selectedSizes || [];
    const next = current.includes(size)
      ? current.filter((s) => s !== size)
      : [...current, size];
    setValue("sizes", next);
  };

  const uploadNewFilesBatch = async (files: File[]): Promise<string[]> => {
    if (files.length === 0) return [];
    setIsUploading(true);
    setUploadProgress({});
    try {
      return (
        await uploadMultipleFiles(
          files,
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

    for (const row of colorRows) {
      if (!row.color.trim()) {
        setSubmitStatus({
          type: "error",
          message: "Preencha o nome de cada cor.",
        });
        return;
      }
      if (row.existingUrls.length + row.files.length === 0) {
        setSubmitStatus({
          type: "error",
          message: `A cor "${row.color.trim()}" precisa de pelo menos uma foto.`,
        });
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const allNewFiles = colorRows.flatMap((r) => r.files);
      const uploadedList = await uploadNewFilesBatch(allNewFiles);
      let offset = 0;
      const sizes = data.sizes ?? [];
      const colorVariants: ProductColorVariant[] = colorRows.map((row) => {
        const n = row.files.length;
        const slice = uploadedList.slice(offset, offset + n);
        offset += n;
        const stockBySize =
          sizes.length > 0
            ? buildVariantStockBySize(row.stockBySize, sizes)
            : undefined;
        return {
          color: row.color.trim(),
          images: [...row.existingUrls, ...slice],
          ...(stockBySize ? { stockBySize } : {}),
        };
      });

      const flatImages = [...new Set(colorVariants.flatMap((v) => v.images))];

      const payload: UpdateProductInput = {
        id: data.id,
        title: data.title,
        subtitle: data.subtitle || undefined,
        description: data.description,
        price: data.price,
        category: data.category || undefined,
        shopCategory: data.shopCategory,
        imageUrl: colorVariants[0].images[0],
        images: flatImages.length > 0 ? flatImages : colorVariants[0].images,
        colorVariants,
        colors: colorVariants.map((v) => v.color),
        sizes: sizes.length ? sizes : undefined,
        isActive: data.isActive,
        ...(sizes.length === 0
          ? {
              stock: data.stock,
              stockBySize:
                data.stockBySize && Object.keys(data.stockBySize).length > 0
                  ? data.stockBySize
                  : undefined,
            }
          : {}),
      };

      const result = await updateProductAction(payload);

      if (result.success) {
        toaster.create({
          title: "Produto atualizado",
          description: "As alterações foram salvas no Firestore.",
          type: "success",
          duration: 4000,
        });
        setColorRows(
          colorVariants.map((v, i) => ({
            id: String(i),
            color: v.color,
            existingUrls: [...v.images],
            files: [],
            previews: [],
            stockBySize: { ...(v.stockBySize ?? {}) },
          })),
        );
        nextColorRowIdRef.current = colorVariants.length;
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
                <Heading size="lg">Cores e fotos</Heading>
                <Text color="gray.600" fontSize="sm">
                  Cada cor tem nome e fotos próprias. A primeira foto de cada
                  cor é a capa dessa variante. Com tamanhos selecionados em
                  &quot;Tamanhos&quot;, informe o estoque por tamanho em cada
                  bloco de cor.
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
                        <Field
                          label="Nome da cor"
                          maxW={{ base: "full", md: "280px" }}
                        >
                          <Input
                            value={row.color}
                            onChange={(e) =>
                              setRowColor(rowIndex, e.target.value)
                            }
                            placeholder="Ex.: Branco, Preto"
                          />
                        </Field>
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

                      <Input
                        type="file"
                        accept="image/*"
                        multiple
                        display="none"
                        id={`${colorFileInputId}-edit-color-upload-${row.id}`}
                        onChange={(e) => handleRowImageSelect(rowIndex, e)}
                      />
                      <label
                        htmlFor={`${colorFileInputId}-edit-color-upload-${row.id}`}
                      >
                        <Button
                          as="span"
                          colorScheme="blue"
                          variant="outline"
                          width="full"
                          cursor="pointer"
                          disabled={
                            row.existingUrls.length + row.files.length >=
                              MAX_IMAGES_PER_COLOR_EDIT || isUploading
                          }
                          type="button"
                        >
                          <IoCloudUpload style={{ marginRight: 8 }} />
                          Adicionar fotos (
                          {row.existingUrls.length + row.files.length}/
                          {MAX_IMAGES_PER_COLOR_EDIT})
                        </Button>
                      </label>

                      {(row.existingUrls.length > 0 ||
                        row.previews.length > 0) && (
                        <Grid
                          templateColumns="repeat(auto-fill, minmax(150px, 1fr))"
                          gap={4}
                          mt={4}
                        >
                          {row.existingUrls.map((url, imgIndex) => (
                            <Box
                              key={`${row.id}-ex-${url}`}
                              position="relative"
                            >
                              <Image
                                src={url}
                                alt={`${row.color || "Cor"} ${imgIndex + 1}`}
                                borderRadius="md"
                                objectFit="cover"
                                height="150px"
                                width="100%"
                              />
                              <Badge
                                position="absolute"
                                top={2}
                                left={2}
                                colorScheme={imgIndex === 0 ? "green" : "gray"}
                              >
                                {imgIndex === 0 ? "Capa" : `#${imgIndex + 1}`}
                              </Badge>
                              <IconButton
                                position="absolute"
                                top={2}
                                right={2}
                                size="sm"
                                colorScheme="red"
                                onClick={() =>
                                  removeExistingUrl(rowIndex, imgIndex)
                                }
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
                              <Badge position="absolute" top={2} left={2}>
                                Nova
                              </Badge>
                              <IconButton
                                position="absolute"
                                top={2}
                                right={2}
                                size="sm"
                                colorScheme="red"
                                onClick={() =>
                                  removeNewFile(rowIndex, imgIndex)
                                }
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
                                  onClick={() =>
                                    adjustRowStock(rowIndex, size, -1)
                                  }
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
                                  onClick={() =>
                                    adjustRowStock(rowIndex, size, 1)
                                  }
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
                    disabled={
                      colorRows.length >= MAX_COLORS_EDIT || isUploading
                    }
                  >
                    <HStack gap={2}>
                      <IoAdd />
                      <Text>Adicionar outra cor</Text>
                    </HStack>
                  </Button>
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
                  {selectedSizes.length === 0 ? (
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
                  ) : (
                    <Text fontSize="sm" color="gray.600">
                      Com tamanhos ativos, o estoque é definido por cor na seção
                      &quot;Cores e fotos&quot; (cada cor com quantidades por
                      tamanho).
                    </Text>
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
