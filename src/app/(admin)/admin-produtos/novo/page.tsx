/**
 * Página: Novo Produto
 *
 * Wrapper fino sobre o formulário único de produto (ProductForm),
 * compartilhado com a tela de edição/enriquecimento.
 */

"use client";

import { ProductForm } from "@/app/components/admin/product-form";

export default function NovoProductPage() {
  return <ProductForm />;
}
