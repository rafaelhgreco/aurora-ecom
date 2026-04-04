/**
 * Página: Novo Produto
 *
 * Página de cadastro de novo produto com upload de imagens
 * Integrado com Firestore Database e Firebase Storage
 */

"use client";

import {
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
  Spinner,
  Stack,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";
import {
  IoAdd,
  IoAddOutline,
  IoArrowBack,
  IoClose,
  IoCloudUpload,
  IoRemoveOutline,
} from "react-icons/io5";
import { z } from "zod";
import { useProductCRUD } from "@/app/hooks/use-product-crud";
import type { CreateProductInput } from "@/app/types/product";
import { Alert } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { ProgressBar, ProgressRoot } from "@/components/ui/progress";
import { toaster } from "@/components/ui/toaster";
import {
  SHOP_CATEGORY_IDS,
  SHOP_CATEGORY_LABELS,
} from "@/core/catalog/shop-catalog";
import type { ProductColorVariant } from "@/core/schemas/product.schema";
import {
  PRODUCT_SIZES,
  type ProductSize,
  productSizeSchema,
} from "@/core/schemas/product.schema";
import { uploadMultipleFiles } from "@/infrastructure/lib/cloudinary.service";
import { buildVariantStockBySize } from "@/shared/admin-product-stock";

type ColorDraft = {
  id: string;
  color: string;
  files: File[];
  previews: string[];
  stockBySize: Partial<Record<ProductSize, number>>;
};

const MAX_COLORS = 12;
const MAX_IMAGES_PER_COLOR = 10;

/** Referência estável: evita `|| []` novo a cada render (loop em useEffect). */
const EMPTY_SIZES: ProductSize[] = [];

const formSchema = z.object({
  title: z
    .string()
    .min(3, "Título deve ter no mínimo 3 caracteres")
    .max(100, "Título deve ter no máximo 100 caracteres"),
  subtitle: z.string().optional(),
  description: z
    .string()
    .min(10, "Descrição deve ter no mínimo 10 caracteres")
    .max(5000, "Descrição deve ter no máximo 5000 caracteres"),
  price: z
    .number()
    .positive("Preço deve ser maior que zero")
    .multipleOf(0.01, "Preço deve ter no máximo 2 casas decimais"),
  category: z.string().optional(),
  shopCategory: z.enum(SHOP_CATEGORY_IDS as unknown as [string, ...string[]]),
  stock: z.number().int().nonnegative().default(0),
  sizes: z.array(productSizeSchema).optional(),
  isActive: z.boolean().default(true),
});

type FormInput = z.infer<typeof formSchema>;

export default function NovoProductPage() {
  const router = useRouter();
  const { createProduct } = useProductCRUD();
  const colorFileInputId = useId();
  /** IDs sequenciais estáveis (SSR = cliente). Evita hydration mismatch de crypto.randomUUID. */
  const nextColorRowIdRef = useRef(1);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<number, number>>(
    {},
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [colorRows, setColorRows] = useState<ColorDraft[]>(() => [
    {
      id: "0",
      color: "",
      files: [],
      previews: [],
      stockBySize: {},
    },
  ]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<FormInput>({
    // biome-ignore lint/suspicious/noExplicitAny: zodResolver type compatibility
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      title: "",
      description: "",
      price: 0,
      stock: 0,
      isActive: true,
      shopCategory: "roupas",
    },
  });

  const rawSizes = watch("sizes");
  /** `?? EMPTY_SIZES` evita `|| []` (novo array a cada render → loop no useEffect abaixo). */
  const selectedSizes = rawSizes ?? EMPTY_SIZES;
  const isActive = watch("isActive") ?? true;

  useEffect(() => {
    if (selectedSizes.length > 0) {
      setValue("stock", 0);
    }
  }, [selectedSizes.length, setValue]);

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

  const addColorRow = () => {
    if (colorRows.length >= MAX_COLORS) return;
    const stockBySize: Partial<Record<ProductSize, number>> = {};
    for (const s of selectedSizes) {
      stockBySize[s] = 0;
    }
    setColorRows((prev) => [
      ...prev,
      {
        id: String(nextColorRowIdRef.current++),
        color: "",
        files: [],
        previews: [],
        stockBySize,
      },
    ]);
  };

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
      const room = MAX_IMAGES_PER_COLOR - row.files.length;
      if (room <= 0) return prev;
      const toAdd = files.slice(0, room);
      const newPreviews = toAdd.map((file) => URL.createObjectURL(file));
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

  const handleRemoveRowImage = (rowIndex: number, imageIndex: number) => {
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

  /**
   * Upload em lote (ordem preservada por cor).
   */
  const uploadColorVariants = async (): Promise<ProductColorVariant[]> => {
    const allFiles = colorRows.flatMap((r) => r.files);
    if (allFiles.length === 0) {
      throw new Error("Adicione pelo menos uma foto em alguma cor");
    }

    setIsUploading(true);
    setUploadProgress({});

    try {
      const results = await uploadMultipleFiles(
        allFiles,
        "products/images",
        (fileIndex, progress) => {
          setUploadProgress((prev) => ({
            ...prev,
            [fileIndex]: progress.progress,
          }));
        },
      );
      const urls = results.map((r) => r.url);
      let offset = 0;
      return colorRows.map((row) => {
        const n = row.files.length;
        const slice = urls.slice(offset, offset + n);
        offset += n;
        return { color: row.color.trim(), images: slice };
      });
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Toggle size selection
   */
  const handleToggleSize = (size: ProductSize) => {
    const current = selectedSizes;
    const newSizes = current.includes(size)
      ? current.filter((s) => s !== size)
      : [...current, size];
    setValue("sizes", newSizes);
  };

  /**
   * Submit do formulário
   */
  const onSubmit: SubmitHandler<FormInput> = async (data) => {
    try {
      setIsSubmitting(true);
      setSubmitStatus(null);

      if (!data.sizes?.length) {
        toaster.create({
          title: "Tamanhos obrigatórios",
          description:
            "Selecione os tamanhos e defina o estoque de cada um em cada cor.",
          type: "warning",
          duration: 4000,
        });
        setIsSubmitting(false);
        return;
      }

      for (const row of colorRows) {
        if (!row.color.trim()) {
          toaster.create({
            title: "Cor obrigatória",
            description: "Preencha o nome de cada cor (ex.: Branco, Preto).",
            type: "warning",
            duration: 4000,
          });
          setIsSubmitting(false);
          return;
        }
        if (row.files.length === 0) {
          toaster.create({
            title: "Fotos por cor",
            description: `Adicione pelo menos uma foto para a cor "${row.color.trim() || "(sem nome)"}".`,
            type: "warning",
            duration: 4000,
          });
          setIsSubmitting(false);
          return;
        }
      }

      const colorVariantsUploaded = await uploadColorVariants();
      const sizes = data.sizes ?? [];
      const colorVariants: ProductColorVariant[] = colorVariantsUploaded.map(
        (v, i) => ({
          ...v,
          stockBySize: buildVariantStockBySize(colorRows[i].stockBySize, sizes),
        }),
      );
      const flatImages = [...new Set(colorVariants.flatMap((v) => v.images))];

      const productData: CreateProductInput = {
        title: data.title,
        subtitle: data.subtitle,
        description: data.description,
        price: data.price,
        imageUrl: colorVariants[0].images[0],
        images: flatImages.length > 0 ? flatImages : colorVariants[0].images,
        colorVariants,
        category: data.category,
        shopCategory: data.shopCategory,
        stock: sizes.length > 0 ? 0 : (data.stock ?? 0),
        sizes,
        colors: colorVariants.map((v) => v.color),
        isActive: data.isActive ?? true,
      };

      const result = await createProduct(productData);

      if (result.success) {
        toaster.create({
          title: "✅ Produto Cadastrado!",
          description: `${productData.title} foi adicionado ao Firestore com sucesso!`,
          type: "success",
          duration: 5000,
        });

        setSubmitStatus({
          type: "success",
          message: "Produto cadastrado com sucesso! Redirecionando...",
        });

        reset();
        nextColorRowIdRef.current = 1;
        setColorRows([
          {
            id: "0",
            color: "",
            files: [],
            previews: [],
            stockBySize: {},
          },
        ]);

        setTimeout(() => {
          router.push("/admin-produtos");
        }, 2000);
      } else {
        toaster.create({
          title: "❌ Erro ao Cadastrar",
          description: result.error || "Erro ao cadastrar produto",
          type: "error",
          duration: 5000,
        });

        setSubmitStatus({
          type: "error",
          message: result.error || "Erro ao cadastrar produto",
        });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro desconhecido";
      setSubmitStatus({
        type: "error",
        message,
      });
      toaster.create({
        title: "Erro",
        description: message,
        type: "error",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxW="container.xl" py={8}>
      {/* Header com botão de voltar */}
      <HStack mb={6} justify="space-between">
        <Box>
          <Heading size="2xl">Novo Produto</Heading>
          <Text color="gray.600" mt={2}>
            Cadastre um novo produto no Firestore com imagens no Storage
          </Text>
        </Box>
        <Button
          onClick={() => router.push("/admin-produtos")}
          variant="outline"
        >
          <IoArrowBack />
          Voltar
        </Button>
      </HStack>

      {/* Status Message */}
      {submitStatus && (
        <Alert
          status={submitStatus.type}
          title={submitStatus.type === "success" ? "Sucesso!" : "Erro"}
        >
          {submitStatus.message}
        </Alert>
      )}

      {colorRows.every((r) => r.files.length === 0) && (
        <Alert status="info" title="Atenção">
          Cadastre pelo menos uma cor com nome e fotos (até{" "}
          {MAX_IMAGES_PER_COLOR} fotos por cor).
        </Alert>
      )}

      {/* Formulário */}
      <form
        onSubmit={handleSubmit(
          // biome-ignore lint/suspicious/noExplicitAny: handleSubmit type compatibility
          onSubmit as any,
          () => {
            toaster.create({
              title: "Erro de Validação",
              description: "Preencha todos os campos obrigatórios corretamente",
              type: "error",
              duration: 5000,
            });
          },
        )}
      >
        <VStack gap={6} align="stretch">
          {/* === CORES E FOTOS === */}
          <Card.Root>
            <Card.Header>
              <Heading size="lg">Cores e fotos</Heading>
              <Text color="gray.600" fontSize="sm">
                Para cada cor, informe o nome e as fotos dessa variante (a
                primeira foto de cada cor é a capa dessa cor na loja). Depois de
                escolher os tamanhos em &quot;Variações&quot;, defina abaixo o
                estoque de cada tamanho para esta cor.
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
                        required
                        maxW={{ base: "full", md: "280px" }}
                      >
                        <Input
                          value={row.color}
                          onChange={(e) =>
                            setRowColor(rowIndex, e.target.value)
                          }
                          placeholder="Ex.: Branco, Preto, Azul"
                        />
                      </Field>
                      <HStack>
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
                    </HStack>

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
                    >
                      <Button
                        as="span"
                        colorScheme="blue"
                        variant="outline"
                        width="full"
                        cursor="pointer"
                        disabled={
                          row.files.length >= MAX_IMAGES_PER_COLOR ||
                          isUploading
                        }
                        type="button"
                      >
                        <IoCloudUpload />
                        Adicionar fotos desta cor ({row.files.length}/
                        {MAX_IMAGES_PER_COLOR})
                      </Button>
                    </label>

                    {row.previews.length > 0 && (
                      <Grid
                        templateColumns="repeat(auto-fill, minmax(150px, 1fr))"
                        gap={4}
                        mt={4}
                      >
                        {row.previews.map((preview, imgIndex) => (
                          <Box
                            key={preview}
                            position="relative"
                            borderRadius="md"
                            overflow="hidden"
                            border="1px solid"
                            borderColor="gray.200"
                          >
                            <Image
                              src={preview}
                              alt={`${row.color || "Cor"} ${imgIndex + 1}`}
                              height="150px"
                              width="full"
                              objectFit="cover"
                            />
                            <IconButton
                              aria-label="Remover imagem"
                              position="absolute"
                              top={2}
                              right={2}
                              size="sm"
                              colorScheme="red"
                              onClick={() =>
                                handleRemoveRowImage(rowIndex, imgIndex)
                              }
                            >
                              <IoClose />
                            </IconButton>
                            {imgIndex === 0 && (
                              <Box
                                position="absolute"
                                bottom={0}
                                left={0}
                                right={0}
                                bg="blue.500"
                                color="white"
                                fontSize="xs"
                                textAlign="center"
                                py={1}
                              >
                                Capa desta cor
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
                                {colorRows[rowIndex]?.stockBySize[size] ?? 0}
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
                  disabled={colorRows.length >= MAX_COLORS || isUploading}
                >
                  <HStack gap={2}>
                    <IoAdd />
                    <Text>Adicionar outra cor</Text>
                  </HStack>
                </Button>

                {isUploading && (
                  <VStack gap={2}>
                    {Object.entries(uploadProgress).map(([index, progress]) => (
                      <Box key={`progress-${index}`} width="full">
                        <HStack justify="space-between" mb={1}>
                          <Text fontSize="sm">Arquivo {Number(index) + 1}</Text>
                          <Text fontSize="sm">{Math.round(progress)}%</Text>
                        </HStack>
                        <ProgressRoot value={progress}>
                          <ProgressBar />
                        </ProgressRoot>
                      </Box>
                    ))}
                  </VStack>
                )}
              </VStack>
            </Card.Body>
          </Card.Root>

          {/* === INFORMAÇÕES BÁSICAS === */}
          <Card.Root>
            <Card.Header>
              <Heading size="lg">Informações Básicas</Heading>
            </Card.Header>
            <Card.Body>
              <Stack gap={4}>
                <Field
                  label="Título"
                  required
                  invalid={!!errors.title}
                  errorText={errors.title?.message}
                >
                  <Input {...register("title")} placeholder="Nome do produto" />
                </Field>

                <Field
                  label="Subtítulo"
                  invalid={!!errors.subtitle}
                  errorText={errors.subtitle?.message}
                >
                  <Input
                    {...register("subtitle")}
                    placeholder="Descrição curta"
                  />
                </Field>

                <Field
                  label="Descrição"
                  required
                  invalid={!!errors.description}
                  errorText={errors.description?.message}
                >
                  <Textarea
                    {...register("description")}
                    placeholder="Descrição detalhada do produto"
                    rows={4}
                  />
                </Field>

                <Grid
                  templateColumns={{
                    base: "1fr",
                    md: selectedSizes.length === 0 ? "1fr 1fr" : "1fr",
                  }}
                  gap={4}
                >
                  <Field
                    label="Preço (R$)"
                    required
                    invalid={!!errors.price}
                    errorText={errors.price?.message}
                  >
                    <Input
                      {...register("price", { valueAsNumber: true })}
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                    />
                  </Field>

                  {selectedSizes.length === 0 ? (
                    <Field
                      label="Estoque"
                      required
                      invalid={!!errors.stock}
                      errorText={errors.stock?.message}
                    >
                      <Input
                        {...register("stock", { valueAsNumber: true })}
                        type="number"
                        placeholder="0"
                      />
                    </Field>
                  ) : null}
                </Grid>

                <Field
                  label="Categoria"
                  invalid={!!errors.category}
                  errorText={errors.category?.message}
                >
                  <Input
                    {...register("category")}
                    placeholder="Ex: Roupas, Acessórios"
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

          {/* === VARIAÇÕES === */}
          <Card.Root>
            <Card.Header>
              <Heading size="lg">Variações</Heading>
              <Text color="gray.600" fontSize="sm" mt={1}>
                Com tamanhos selecionados, o estoque é informado por cor acima
                (cada cor pode ter quantidades diferentes por tamanho).
              </Text>
            </Card.Header>
            <Card.Body>
              <Stack gap={4}>
                <Box>
                  <Text fontWeight="medium" mb={2}>
                    Tamanhos disponíveis
                  </Text>
                  <Grid
                    templateColumns="repeat(auto-fill, minmax(80px, 1fr))"
                    gap={2}
                  >
                    {PRODUCT_SIZES.map((size) => (
                      <Checkbox
                        key={size}
                        checked={selectedSizes.includes(size)}
                        onCheckedChange={() => handleToggleSize(size)}
                      >
                        {size}
                      </Checkbox>
                    ))}
                  </Grid>
                </Box>
              </Stack>
            </Card.Body>
          </Card.Root>

          {/* === STATUS === */}
          <Card.Root>
            <Card.Header>
              <Heading size="lg">Status</Heading>
            </Card.Header>
            <Card.Body>
              <Checkbox
                checked={isActive}
                onCheckedChange={(e) => {
                  const value = e.checked === true;
                  setValue("isActive", value);
                }}
              >
                Produto Ativo (visível na loja)
              </Checkbox>
            </Card.Body>
          </Card.Root>

          {/* === BOTÕES === */}
          <HStack justify="flex-end" gap={3}>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin-produtos")}
              disabled={isSubmitting || isUploading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              colorScheme="blue"
              disabled={
                isSubmitting ||
                isUploading ||
                colorRows.every((r) => r.files.length === 0)
              }
              onClick={(e) => {
                if (colorRows.every((r) => r.files.length === 0)) {
                  e.preventDefault();
                  toaster.create({
                    title: "Atenção",
                    description:
                      "Cadastre pelo menos uma cor com fotos antes de enviar",
                    type: "warning",
                    duration: 3000,
                  });
                }
              }}
            >
              {(isUploading || isSubmitting) && <Spinner size="sm" mr={2} />}
              {isUploading
                ? "Fazendo Upload..."
                : isSubmitting
                  ? "Cadastrando..."
                  : colorRows.every((r) => r.files.length === 0)
                    ? "Adicione fotos por cor"
                    : "Cadastrar Produto"}
            </Button>
          </HStack>
        </VStack>
      </form>
    </Container>
  );
}
