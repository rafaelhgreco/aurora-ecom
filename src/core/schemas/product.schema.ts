import { z } from "zod";

export const productSchema = z.object({
  id: z.string().uuid("ID deve ser um UUID válido").optional(),

  title: z
    .string({ message: "Título é obrigatório" })
    .min(3, "Título deve ter no mínimo 3 caracteres")
    .max(100, "Título deve ter no máximo 100 caracteres")
    .trim(),

  subtitle: z
    .string()
    .min(3, "Subtítulo deve ter no mínimo 3 caracteres")
    .max(200, "Subtítulo deve ter no máximo 200 caracteres")
    .trim()
    .optional(),

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

  sizes: z
    .array(z.enum(["PP", "P", "M", "G", "GG", "XG"]))
    .min(1, "Produto deve ter pelo menos um tamanho disponível")
    .optional(),

  colors: z.array(z.string().min(2).max(30)).optional(),

  isActive: z.boolean().default(true),

  createdAt: z.date().optional(),

  updatedAt: z.date().optional(),
});

export const createProductSchema = productSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateProductSchema = productSchema
  .partial()
  .required({ id: true });

export const productFilterSchema = z.object({
  category: z.string().optional(),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
  sizes: z.array(z.enum(["PP", "P", "M", "G", "GG", "XG"])).optional(),
  isActive: z.boolean().optional(),
  search: z.string().optional(),
});

export type Product = z.infer<typeof productSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductFilter = z.infer<typeof productFilterSchema>;
