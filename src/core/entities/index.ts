/**
 * Barrel file para entidades
 * Centraliza exports para facilitar imports
 */

// Re-export tipos do schema
export type {
  CreateProductInput,
  Product,
  ProductCategory,
  ProductFilter,
  ProductSize,
  SerializedProduct,
  UpdateProductInput,
} from "../schemas/product.schema";
export {
  PRODUCT_CATEGORIES,
  PRODUCT_SIZES,
} from "../schemas/product.schema";
// Cart
export { CartEntity } from "./cart.entity";
export type { CartItemVariants } from "./cart-item.entity";
export { CartItemEntity } from "./cart-item.entity";
// Product
export { ProductEntity } from "./product.entity";
