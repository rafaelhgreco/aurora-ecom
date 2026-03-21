/**
 * Página: Admin Produtos
 *
 * CRUD completo de produtos
 */

"use client";

import { Box, Container } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DeleteConfirmDialog } from "@/app/components/admin/delete-confirm-dialog";
import { ProductList } from "@/app/components/admin/product-list";
import { ProductViewDialog } from "@/app/components/admin/product-view-dialog";
import { useProductCRUD } from "@/app/hooks/use-product-crud";
import type { Product } from "@/app/types/product";
import { toaster } from "@/components/ui/toaster";

export default function AdminProductsPage() {
  const router = useRouter();

  const { products, isLoading, error, loadProducts, deleteProduct } =
    useProductCRUD();

  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [deleteProductData, setDeleteProductData] = useState<Product | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      loadProducts();
    }
  }, [isMounted, loadProducts]);

  useEffect(() => {
    if (error) {
      toaster.create({
        title: "Erro",
        description: error,
        type: "error",
        duration: 5000,
      });
    }
  }, [error]);

  const handleView = (product: Product) => {
    setViewProduct(product);
  };

  const handleEdit = (product: Product) => {
    router.push(`/admin-produtos/editar/${product.id}`);
  };

  const handleDeleteClick = (product: Product) => {
    setDeleteProductData(product);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteProductData?.id) return;

    setIsDeleting(true);
    const result = await deleteProduct(deleteProductData.id);
    setIsDeleting(false);

    if (result.success) {
      toaster.create({
        title: "Sucesso",
        description: "Produto deletado com sucesso",
        type: "success",
        duration: 3000,
      });
      setDeleteProductData(null);
    } else {
      toaster.create({
        title: "Erro",
        description: result.error || "Erro ao deletar produto",
        type: "error",
        duration: 5000,
      });
    }
  };

  const handleAdd = () => {
    router.push("/admin-produtos/novo");
  };

  if (!isMounted) {
    return null;
  }

  return (
    <Container maxW="container.xl" py={8}>
      <Box>
        <ProductList
          products={products}
          isLoading={isLoading}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          onAdd={handleAdd}
          onInventoryChange={loadProducts}
        />
      </Box>

      {/* Modal de Visualização */}
      <ProductViewDialog
        open={!!viewProduct}
        product={viewProduct}
        onClose={() => setViewProduct(null)}
      />

      {/* Modal de Confirmação de Delete */}
      <DeleteConfirmDialog
        open={!!deleteProductData}
        product={deleteProductData}
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteProductData(null)}
      />
    </Container>
  );
}
