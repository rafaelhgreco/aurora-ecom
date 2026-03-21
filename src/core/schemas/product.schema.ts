import { z } from "zod";

/**
 * Constantes de Produto
 * Fonte única da verdade para valores permitidos
 */
export const PRODUCT_SIZES = ["PP", "P", "M", "G", "GG", "XG"] as const;
export type ProductSize = (typeof PRODUCT_SIZES)[number];

export const PRODUCT_CATEGORIES = [
  "camisetas",
  "calcas",
  "shorts",
  "vestidos",
  "acessorios",
  "calcados",
] as const;
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

/**
 * Validações Zod para Produto
 */
export const productSizeSchema = z.enum(PRODUCT_SIZES);
export const productCategorySchema = z.enum(PRODUCT_CATEGORIES);

export const productSchema = z.object({
  /** IDs do Firestore não são UUID; aceita qualquer string não vazia */
  id: z.string().min(1, "ID inválido").optional(),

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

  category: z
    .string()
    .min(2, "Categoria deve ter no mínimo 2 caracteres")
    .max(50, "Categoria deve ter no máximo 50 caracteres")
    .optional(),

  stock: z
    .number()
    .int("Estoque deve ser um número inteiro")
    .nonnegative("Estoque não pode ser negativo")
    .default(0),

  /**
   * Estoque por tamanho. Quando definido e produto tem sizes, é a fonte de verdade.
   * Caso contrário usa `stock` global (produtos sem tamanhos).
   * Chaves devem ser ProductSize; valores inteiros >= 0.
   */
  stockBySize: z
    .record(z.string(), z.number().int().nonnegative())
    .refine(
      (val) =>
        Object.keys(val).every((k) =>
          (PRODUCT_SIZES as readonly string[]).includes(k),
        ),
      { message: "Chaves de stockBySize devem ser tamanhos válidos" },
    )
    .optional(),

  sizes: z
    .array(productSizeSchema)
    .min(1, "Produto deve ter pelo menos um tamanho disponível")
    .optional(),

  colors: z.array(z.string().min(2).max(30)).optional(),

  isActive: z.boolean().default(true),

  createdAt: z.date().optional(),

  updatedAt: z.date().optional(),
});

export const serializedProductSchema = productSchema.extend({
  createdAt: z.union([z.date(), z.string()]).optional(),
  updatedAt: z.union([z.date(), z.string()]).optional(),
});

export const createProductSchema = productSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateProductSchema = productSchema
  .partial()
  .required({ id: true });

/** Formulário de edição admin: mesmo shape de criação + id do Firestore */
export const productEditFormSchema = createProductSchema.extend({
  id: z.string().min(1, "ID do produto é obrigatório"),
});

export type ProductEditFormInput = z.infer<typeof productEditFormSchema>;

/**
 * Formulário admin: imagens tratadas no componente (URLs existentes + upload);
 * cores como texto livre (vírgulas).
 */
export const productAdminEditFormSchema = productEditFormSchema
  .omit({ colors: true, images: true, imageUrl: true })
  .extend({
    colorsText: z.string().optional(),
  });

export type ProductAdminEditFormValues = z.infer<
  typeof productAdminEditFormSchema
>;

export const productFilterSchema = z.object({
  category: z.string().optional(),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
  sizes: z.array(productSizeSchema).optional(),
  isActive: z.boolean().optional(),
  search: z.string().optional(),
});

export type Product = z.infer<typeof productSchema>;
export type SerializedProduct = z.infer<typeof serializedProductSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductFilter = z.infer<typeof productFilterSchema>;
