/**
 * Página: Admin
 *
 * CRUD de produtos e gestão de pedidos com switch Produtos | Pedidos.
 */

"use client";

import { Box, Button, Container, HStack } from "@chakra-ui/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { DeleteConfirmDialog } from "@/app/components/admin/delete-confirm-dialog";
import { OrderTable } from "@/app/components/admin/order-table";
import { ProductList } from "@/app/components/admin/product-list";
import { ProductViewDialog } from "@/app/components/admin/product-view-dialog";
import { LoadingState } from "@/app/components/states/loading-state";
import { useProductCRUD } from "@/app/hooks/use-product-crud";
import type { Product } from "@/app/types/product";
import { toaster } from "@/components/ui/toaster";

type AdminView = "produtos" | "pedidos";

export default function AdminProductsPage() {
  return (
    <Suspense fallback={<LoadingState minHeight="400px" />}>
      <AdminPageContent />
    </Suspense>
  );
}

function AdminPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewParam = searchParams.get("view");

  const [view, setView] = useState<AdminView>(() =>
    viewParam === "pedidos" ? "pedidos" : "produtos",
  );

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
    setView(viewParam === "pedidos" ? "pedidos" : "produtos");
  }, [viewParam]);

  useEffect(() => {
    if (isMounted && view === "produtos") {
      loadProducts();
    }
  }, [isMounted, view, loadProducts]);

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

  const handleView = (product: Product) => setViewProduct(product);

  const handleEdit = (product: Product) => {
    router.push(`/admin-produtos/editar/${product.id}`);
  };

  const handleDeleteClick = (product: Product) => setDeleteProductData(product);

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

  const handleAdd = () => router.push("/admin-produtos/novo");

  const updateView = (v: AdminView) => {
    setView(v);
    router.replace(
      v === "pedidos" ? "/admin-produtos?view=pedidos" : "/admin-produtos",
    );
  };

  if (!isMounted) return null;

  return (
    <Container maxW="container.xl" py={8}>
      <HStack
        gap={1}
        bg="gray.100"
        borderRadius="md"
        p={1}
        mb={6}
        w="fit-content"
      >
        <Button
          size="sm"
          variant={view === "produtos" ? "solid" : "ghost"}
          onClick={() => updateView("produtos")}
        >
          Produtos
        </Button>
        <Button
          size="sm"
          variant={view === "pedidos" ? "solid" : "ghost"}
          onClick={() => updateView("pedidos")}
        >
          Pedidos
        </Button>
      </HStack>

      {view === "produtos" && (
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
      )}

      {view === "pedidos" && <OrderTable />}

      <ProductViewDialog
        open={!!viewProduct}
        product={viewProduct}
        onClose={() => setViewProduct(null)}
      />

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
