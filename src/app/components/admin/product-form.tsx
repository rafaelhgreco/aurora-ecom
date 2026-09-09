"use client";
"use no memo";

/**
 * Formulário único de produto — cadastro, edição e enriquecimento (DRAFT → ACTIVE).
 *
 * Sem `product`: cadastro de produto novo (chama createProductAction).
 * Com `product` status ACTIVE: edição (chama updateProductAction).
 * Com `product` status DRAFT: enriquecimento (chama publishProductAction).
 */

import {
  Badge,
  Box,
  Button,
  Container,
  Heading,
  HStack,
  Input,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import {
  createProductAction,
  publishProductAction,
  updateProductAction,
} from "@/app/actions/products";
import { useCategories } from "@/app/hooks/use-categories";
import { useSections } from "@/app/hooks/use-sections";
import type { Product } from "@/app/types/product";
import { Alert } from "@/components/ui/alert";
import { toaster } from "@/components/ui/toaster";
import {
  type CreateProductInput,
  inferSizePresetFromSizes,
  PRODUCT_SIZES_CLOTHING,
  PRODUCT_SIZES_VOLUME,
  type ProductColorVariant,
  type ProductFormInput,
  type ProductFormValues,
  type ProductSize,
  type PublishProductInput,
  productFormSchema,
  type SizePresetKind,
  type UpdateProductInput,
} from "@/core/schemas/product.schema";
import { uploadMultipleFiles } from "@/infrastructure/lib/cloudinary.service";
import type { ActionResult } from "@/shared/action-result";
import { buildVariantStockBySize } from "@/shared/admin-product-stock";
import { ADMIN_GENERIC } from "@/shared/errors/client-error-messages";
import { slugify } from "@/shared/slugify";
import { ProductBasicDataCard } from "./product-form/product-basic-data-card";
import { ProductColorVariantsCard } from "./product-form/product-color-variants-card";
import { ProductPriceStockCard } from "./product-form/product-price-stock-card";
import { ProductSizesCard } from "./product-form/product-sizes-card";
import {
  type ColorEditRow,
  useColorVariantRows,
} from "./product-form/use-color-variant-rows";

/** Referência estável: evita `|| []` novo a cada render (loop em useEffect). */
const EMPTY_SIZES: ProductSize[] = [];

function createFormDefaults(): ProductFormValues {
  return {
    title: "",
    slug: "",
    subtitle: "",
    description: "",
    price: 0,
    stock: 0,
    category: "",
    shopCategory: "roupas",
    sizes: [],
    isActive: true,
    status: "ACTIVE",
    colorsText: "",
  };
}

function productToFormDefaults(product: Product): ProductFormValues {
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
    slug: product.slug ?? "",
    subtitle: product.subtitle ?? "",
    description: product.description,
    price: product.price,
    stock: product.stock,
    stockBySize,
    category: product.category ?? "",
    shopCategory: product.shopCategory ?? "roupas",
    sizes,
    isActive: product.isActive ?? true,
    status: product.status ?? "ACTIVE",
    colorsText: "",
  };
}

function buildColorRowsFromProduct(product?: Product): ColorEditRow[] {
  if (!product) {
    return [
      {
        id: "0",
        color: "",
        existingUrls: [],
        files: [],
        previews: [],
        stockBySize: {},
      },
    ];
  }
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

interface ProductFormProps {
  product?: Product;
}

export function ProductForm({ product }: ProductFormProps) {
  const router = useRouter();
  const isEdit = !!product;

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<number, number>>(
    {},
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [sizePreset, setSizePreset] = useState<SizePresetKind>(() =>
    inferSizePresetFromSizes(product?.sizes ?? []),
  );
  const [customSizeDraft, setCustomSizeDraft] = useState("");

  const defaults = useMemo(
    () => (product ? productToFormDefaults(product) : createFormDefaults()),
    [product],
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    setError,
    watch,
    reset,
  } = useForm<ProductFormInput, unknown, ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: defaults,
  });

  const { sections } = useSections();
  const { categories } = useCategories();

  const shopCategoryValue = watch("shopCategory");
  const categoryValue = watch("category");

  /** Troca de seção (ação explícita do usuário): limpa a subcategoria se ela
   *  não pertencer mais à nova seção (stacking Seção + Subcategoria). */
  const handleShopCategoryChange = (nextSectionId: string) => {
    setValue("shopCategory", nextSectionId, { shouldValidate: true });
    const currentCategory = watch("category");
    if (!currentCategory) return;
    const belongsToNewSection = categories.some(
      (c) => c.name === currentCategory && c.sectionId === nextSectionId,
    );
    if (!belongsToNewSection) {
      setValue("category", "");
    }
  };

  const rawSizes = watch("sizes");
  /** `?? EMPTY_SIZES` evita `|| []` (novo array a cada render → loop no hook abaixo). */
  const selectedSizes = rawSizes ?? EMPTY_SIZES;

  const {
    colorRows,
    resetRows,
    addColorRow,
    removeColorRow,
    setRowColor,
    addRowImageFiles,
    removeExistingUrl,
    removeNewFile,
    adjustRowStock,
  } = useColorVariantRows({
    initialRows: buildColorRowsFromProduct(product),
    selectedSizes,
  });

  useEffect(() => {
    if (selectedSizes.length > 0) {
      setValue("stockBySize", {});
      setValue("stock", 0);
    }
  }, [selectedSizes.length, setValue]);

  const slugTouchedRef = useRef(false);

  useEffect(() => {
    reset(defaults);
    resetRows(buildColorRowsFromProduct(product));
    setSizePreset(inferSizePresetFromSizes(product?.sizes ?? []));
    slugTouchedRef.current = false;
  }, [product, defaults, reset, resetRows]);

  const titleValue = watch("title");

  /** Sugere o slug a partir do título só no cadastro (nunca sobrescreve em edição/enriquecimento) e só antes do admin editar o campo manualmente. */
  useEffect(() => {
    if (isEdit || slugTouchedRef.current) return;
    setValue("slug", slugify(titleValue || ""), { shouldValidate: false });
  }, [titleValue, isEdit, setValue]);

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
    const current = selectedSizes;
    const next = current.includes(size)
      ? current.filter((s) => s !== size)
      : [...current, size];
    setValue("sizes", next);
  };

  const handleAddCustomSize = () => {
    const t = customSizeDraft.trim();
    if (!t || t.length > 32) return;
    if (selectedSizes.includes(t)) return;
    setValue("sizes", [...selectedSizes, t]);
    setCustomSizeDraft("");
  };

  const handleRemoveCustomSize = (size: string) => {
    setValue(
      "sizes",
      selectedSizes.filter((s) => s !== size),
    );
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

  const onSubmit = async (data: ProductFormValues) => {
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

      let result: ActionResult<Product>;

      if (!product) {
        const createPayload: CreateProductInput = {
          title: data.title,
          slug: data.slug || undefined,
          subtitle: data.subtitle || undefined,
          description: data.description,
          price: data.price,
          imageUrl: colorVariants[0].images[0],
          images: flatImages.length > 0 ? flatImages : colorVariants[0].images,
          colorVariants,
          colors: colorVariants.map((v) => v.color),
          category: data.category || undefined,
          shopCategory: data.shopCategory,
          stock: sizes.length > 0 ? 0 : (data.stock ?? 0),
          sizes: sizes.length ? sizes : undefined,
          isActive: data.isActive ?? true,
          status: "ACTIVE",
        };
        result = await createProductAction(createPayload);
      } else if (product.status === "DRAFT") {
        const publishInput: PublishProductInput = {
          id: data.id as string,
          title: data.title,
          slug: data.slug || undefined,
          price: data.price,
          category: data.category || "",
        };
        result = await publishProductAction(publishInput);
      } else {
        const payload: UpdateProductInput = {
          id: data.id as string,
          title: data.title,
          slug: data.slug || undefined,
          subtitle: data.subtitle || undefined,
          description: data.description,
          price: data.price,
          category: data.category || "",
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
        result = await updateProductAction(payload);
      }

      if (result.success) {
        toaster.create({
          title: !product
            ? "Produto cadastrado"
            : product.status === "DRAFT"
              ? "Produto publicado"
              : "Produto atualizado",
          description: !product
            ? "O produto foi cadastrado com sucesso."
            : product.status === "DRAFT"
              ? "O produto foi publicado e está visível na loja."
              : "As alterações foram salvas com sucesso.",
          type: "success",
          duration: 4000,
        });
        router.push("/admin");
        router.refresh();
      } else {
        const slugError = result.details?.find((d) => d.field === "slug");
        if (slugError) {
          setError("slug", { message: slugError.message });
        }
        setSubmitStatus({
          type: "error",
          message:
            result.error ||
            (!product
              ? "Erro ao cadastrar produto"
              : product.status === "DRAFT"
                ? "Erro ao publicar produto"
                : "Erro ao atualizar produto"),
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
        <Box>
          <HStack gap={3} mb={2}>
            <Heading size="2xl">
              {!product
                ? "Cadastrar Produto"
                : product.status === "DRAFT"
                  ? "Enriquecer produto"
                  : "Editar produto"}
            </Heading>
            {product?.status === "DRAFT" && (
              <Badge colorScheme="orange" fontSize="md" px={3} py={1}>
                Rascunho — bipado como {product.barcode}
              </Badge>
            )}
          </HStack>
          <Text color="gray.600" mt={2}>
            {!product
              ? "Preencha os dados do produto e faça upload das imagens por cor."
              : product.status === "DRAFT"
                ? "Preencha os dados do produto para publicá-lo na loja."
                : "Atualize dados, imagens, estoque e disponibilidade na loja."}
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

        <form noValidate onSubmit={handleSubmit(onSubmit)}>
          {isEdit && <Input type="hidden" {...register("id")} />}
          <VStack gap={6} align="stretch">
            <ProductColorVariantsCard
              colorRows={colorRows}
              selectedSizes={selectedSizes}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
              addColorRow={addColorRow}
              removeColorRow={removeColorRow}
              setRowColor={setRowColor}
              addRowImageFiles={addRowImageFiles}
              removeExistingUrl={removeExistingUrl}
              removeNewFile={removeNewFile}
              adjustRowStock={adjustRowStock}
            />

            <ProductBasicDataCard
              register={register}
              errors={errors}
              isEdit={isEdit}
              descriptionValue={watch("description")}
              sections={sections}
              shopCategoryValue={shopCategoryValue}
              onShopCategoryChange={handleShopCategoryChange}
              categories={categories}
              categoryValue={categoryValue}
              onCategoryChange={(value) =>
                setValue("category", value, { shouldValidate: true })
              }
              onSlugTouched={() => {
                slugTouchedRef.current = true;
              }}
              onSlugBlurSanitize={(rawValue) =>
                setValue("slug", slugify(rawValue), { shouldValidate: true })
              }
            />

            <ProductPriceStockCard
              register={register}
              errors={errors}
              selectedSizesLength={selectedSizes.length}
            />

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

            <Stack
              direction={{ base: "column", sm: "row" }}
              justify="flex-end"
              gap={4}
            >
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin")}
                w={{ base: "full", sm: "auto" }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                colorScheme={product?.status === "DRAFT" ? "green" : "blue"}
                loading={isSubmitting || isUploading}
                w={{ base: "full", sm: "auto" }}
              >
                {isUploading
                  ? "Fazendo Upload..."
                  : !product
                    ? "Cadastrar Produto"
                    : product.status === "DRAFT"
                      ? "Publicar produto"
                      : "Salvar alterações"}
              </Button>
            </Stack>
          </VStack>
        </form>
      </VStack>
    </Container>
  );
}
