import { z } from "zod";

export const PRODUCT_STATUSES = ["DRAFT", "ACTIVE"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];
export const productStatusSchema = z.enum(PRODUCT_STATUSES);

export const DRAFT_PLACEHOLDER_IMAGE_URL = "/images/product-placeholder.png";
export const DRAFT_PLACEHOLDER_DESCRIPTION =
  "Produto ainda não descrito. Preencha os detalhes para publicar.";

/**
 * Presets de variação (cadastro admin escolhe um tipo; também há modo personalizado).
 */
export const PRODUCT_SIZES_CLOTHING = [
  "PP",
  "P",
  "M",
  "G",
  "GG",
  "XG",
] as const;
/** Capacidades comuns (cosméticos, líquidos, etc.) */
export const PRODUCT_SIZES_VOLUME = [
  "100ml",
  "250ml",
  "500ml",
  "1000ml",
] as const;

/** @deprecated use PRODUCT_SIZES_CLOTHING — mantido para compatibilidade */
export const PRODUCT_SIZES = PRODUCT_SIZES_CLOTHING;

/** Rótulo de variante (tamanho roupa, volume, ou texto livre no preset personalizado) */
export type ProductSize = string;

export type SizePresetKind = "clothing" | "volume" | "custom";

export function inferSizePresetFromSizes(sizes: string[]): SizePresetKind {
  if (sizes.length === 0) return "clothing";
  const clothing = new Set(PRODUCT_SIZES_CLOTHING as readonly string[]);
  const volume = new Set(PRODUCT_SIZES_VOLUME as readonly string[]);
  if (sizes.every((s) => clothing.has(s))) return "clothing";
  if (sizes.every((s) => volume.has(s))) return "volume";
  return "custom";
}

/**
 * Validações Zod para Produto
 */
export const productSizeSchema = z.string().min(1).max(32).trim();

const stockBySizeRecordSchema = z.record(
  z.string().min(1).max(32),
  z.number().int().nonnegative(),
);

/** Cor com galeria própria e estoque por tamanho nesta variante. */
export const productColorVariantSchema = z.object({
  color: z.string().min(1).max(40).trim(),
  images: z
    .array(z.string().url("URL da imagem inválida"))
    .min(1, "Cada cor precisa de pelo menos uma imagem")
    .max(10),
  /** Estoque por tamanho só desta cor (fonte de verdade quando `colorVariants` existe). */
  stockBySize: stockBySizeRecordSchema.optional(),
});

export type ProductColorVariant = z.infer<typeof productColorVariantSchema>;

function refineProductSizesConsistency(
  data: {
    sizes?: string[];
    stockBySize?: Record<string, number>;
    colorVariants?: Array<{ stockBySize?: Record<string, number> }>;
  },
  ctx: z.RefinementCtx,
) {
  const sizes = data.sizes;
  if (!sizes?.length) return;
  const allowed = new Set(sizes);
  if (data.stockBySize) {
    for (const k of Object.keys(data.stockBySize)) {
      if (!allowed.has(k)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Tamanho "${k}" não está listado em sizes`,
          path: ["stockBySize", k],
        });
      }
    }
  }
  if (data.colorVariants) {
    for (let i = 0; i < data.colorVariants.length; i++) {
      const v = data.colorVariants[i];
      if (!v.stockBySize) continue;
      for (const k of Object.keys(v.stockBySize)) {
        if (!allowed.has(k)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Tamanho "${k}" não está listado em sizes`,
            path: ["colorVariants", i, "stockBySize", k],
          });
        }
      }
    }
  }
}

/** Subcategoria: string livre referenciada pelo nome (não id). `""` = sem subcategoria ("Nenhuma"). */
export const productCategoryValueSchema = z
  .string()
  .min(2, "Categoria deve ter no mínimo 2 caracteres")
  .max(50, "Categoria deve ter no máximo 50 caracteres")
  .optional()
  .or(z.literal(""));

const productObjectSchema = z.object({
  /** IDs do Firestore não são UUID; aceita qualquer string não vazia */
  id: z.string().min(1, "ID inválido").optional(),

  barcode: z
    .string()
    .min(1, "Código de barras é inválido")
    .max(64, "Código de barras deve ter no máximo 64 caracteres")
    .trim()
    .optional(),

  /** URL amigável do produto (`/produto/{slug}`). Gerada a partir do título, editável. */
  slug: z
    .string()
    .min(1, "URL não pode ficar vazia")
    .max(150, "URL deve ter no máximo 150 caracteres")
    .regex(
      /^[a-z0-9]+(-[a-z0-9]+)*$/,
      "Use apenas letras minúsculas, números e hífens",
    )
    .optional(),

  title: z
    .string({ message: "Título é obrigatório" })
    .min(3, "Título deve ter no mínimo 3 caracteres")
    .max(100, "Título deve ter no máximo 100 caracteres")
    .trim(),

  subtitle: z
    .string()
    .max(200, "Subtítulo deve ter no máximo 200 caracteres")
    .trim()
    .optional()
    .or(z.literal("")),

  description: z
    .string({ message: "Descrição é obrigatória" })
    .min(10, "Descrição deve ter no mínimo 10 caracteres")
    .max(5000, "Descrição deve ter no máximo 5000 caracteres")
    .trim(),

  price: z
    .number({ message: "Preço é obrigatório" })
    .positive("Preço deve ser maior que zero")
    .finite("Preço deve ser um número válido")
    .multipleOf(0.01, "Preço deve ter no máximo 2 casas decimais"),

  imageUrl: z
    .string({ message: "Imagem principal é obrigatória" })
    .url("URL da imagem inválida")
    .min(1, "URL da imagem é obrigatória"),

  images: z
    .array(z.string().url("URL da imagem inválida"))
    .min(1, "Produto deve ter pelo menos uma imagem")
    .max(10, "Produto pode ter no máximo 10 imagens")
    .default([]),

  category: productCategoryValueSchema,

  /**
   * Seção do catálogo (id de `sections`). String livre — seções são
   * cadastradas dinamicamente pelo admin, não é mais um enum fixo. A
   * importação em massa (planilha) continua escrevendo só "roupas"/"cabelos",
   * que existem como seções seed com esses mesmos ids.
   */
  shopCategory: z.string().min(1).optional(),

  stock: z
    .number()
    .int("Estoque deve ser um número inteiro")
    .nonnegative("Estoque não pode ser negativo")
    .default(0),

  /**
   * Estoque por tamanho. Quando definido e produto tem sizes, é a fonte de verdade.
   * Caso contrário usa `stock` global (produtos sem tamanhos).
   * Chaves devem existir em `sizes` quando este estiver definido.
   */
  stockBySize: stockBySizeRecordSchema.optional(),

  /** Array vazio = produto sem variação de tamanho (estoque global via `stock`). */
  sizes: z.array(productSizeSchema).optional(),

  colors: z.array(z.string().min(2).max(30)).optional(),

  /** Quando preenchido, cada cor tem suas fotos; `imageUrl`/`images`/`colors` são derivados na normalização. */
  colorVariants: z.array(productColorVariantSchema).max(12).optional(),

  isActive: z.boolean().default(true),

  status: productStatusSchema.default("ACTIVE"),

  createdAt: z.date().optional(),

  updatedAt: z.date().optional(),
});

export const productSchema = productObjectSchema.superRefine(
  refineProductSizesConsistency,
);

/** Formato devolvido pelas Server Actions ao cliente: datas em string ISO. */
export const serializedProductSchema = productObjectSchema
  .extend({
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  })
  .superRefine(refineProductSizesConsistency);

export const createProductSchema = productObjectSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .superRefine(refineProductSizesConsistency);

export const updateProductSchema = productObjectSchema
  .partial()
  .required({ id: true })
  .superRefine(refineProductSizesConsistency);

/** Formulário de edição admin: mesmo shape de criação + id do Firestore */
export const productEditFormSchema = productObjectSchema
  .omit({
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    id: z.string().min(1, "ID do produto é obrigatório"),
  })
  .superRefine(refineProductSizesConsistency);

export type ProductEditFormInput = z.infer<typeof productEditFormSchema>;

/**
 * Formulário admin único (cadastro + edição/enriquecimento): imagens tratadas
 * no componente por cor (`colorVariants`, upload) — `id` é opcional pois no
 * cadastro o produto ainda não existe no Firestore.
 */
export const productFormSchema = productObjectSchema
  .omit({
    createdAt: true,
    updatedAt: true,
    colors: true,
    images: true,
    imageUrl: true,
  })
  .extend({
    id: z.string().optional(),
    colorsText: z.string().optional(),
  })
  .superRefine(refineProductSizesConsistency);

/** Tipo de entrada (pré-parse): campos com `.default()` (stock, isActive, status) são opcionais. */
export type ProductFormInput = z.input<typeof productFormSchema>;
export type ProductFormValues = z.infer<typeof productFormSchema>;

export const productFilterSchema = z.object({
  category: z.string().optional(),
  shopCategory: z.string().min(1).optional(),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
  sizes: z.array(productSizeSchema).optional(),
  isActive: z.boolean().optional(),
  status: productStatusSchema.optional(),
  search: z.string().optional(),
  page: z.number().positive().optional(),
  limitCount: z.number().positive().optional(),
});

export const scanBarcodeSchema = z.object({
  barcode: z.string().min(1, "Código de barras é obrigatório").trim(),
  quantity: z.number().int().positive().default(1),
});
/** Tipo de entrada (pré-parse): `quantity` é opcional pois tem default no schema. */
export type ScanBarcodeInput = z.input<typeof scanBarcodeSchema>;

export const publishProductSchema = z.object({
  id: z.string().min(1, "ID do produto é obrigatório"),
  title: productObjectSchema.shape.title,
  slug: productObjectSchema.shape.slug,
  price: productObjectSchema.shape.price,
  category: z.string().min(2, "Categoria é obrigatória").max(50),
});
export type PublishProductInput = z.infer<typeof publishProductSchema>;

export type Product = z.infer<typeof productSchema>;
export type SerializedProduct = z.infer<typeof serializedProductSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductFilter = z.infer<typeof productFilterSchema>;
