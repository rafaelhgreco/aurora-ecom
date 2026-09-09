/**
 * Página: Admin
 *
 * CRUD de produtos.
 */

"use client";

import { Box, Button, Container, HStack, Text } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { IoBarcode, IoChevronBack, IoChevronForward } from "react-icons/io5";
import { listProductsAction } from "@/app/actions/products";
import { DeleteConfirmDialog } from "@/app/components/admin/delete-confirm-dialog";
import { ProductList } from "@/app/components/admin/product-list";
import { ProductViewDialog } from "@/app/components/admin/product-view-dialog";
import { useProductCRUD } from "@/app/hooks/use-product-crud";
import type { Product } from "@/app/types/product";
import { toaster } from "@/components/ui/toaster";

export default function AdminProductsPage() {
  const router = useRouter();
  const { deleteProduct } = useProductCRUD();

  const [page, setPage] = useState(1);
  const limit = 20;

  const {
    data: result,
    isLoading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ["admin-products", page],
    queryFn: async () => {
      const res = await listProductsAction({ page, limitCount: limit });
      if (!res.success)
        throw new Error(res.error || "Erro ao carregar produtos");
      return res.data;
    },
  });

  const products = result?.data || [];
  const totalCount = result?.totalCount || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

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
    if (queryError) {
      toaster.create({
        title: "Erro",
        description: queryError.message || "Erro ao carregar produtos",
        type: "error",
        duration: 5000,
      });
    }
  }, [queryError]);

  const handleView = (product: Product) => setViewProduct(product);

  const handleEdit = (product: Product) => {
    router.push(`/admin/editar/${product.id}`);
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
      refetch();
    } else {
      toaster.create({
        title: "Erro",
        description: result.error || "Erro ao deletar produto",
        type: "error",
        duration: 5000,
      });
    }
  };

  const handleAdd = () => router.push("/admin/novo");

  if (!isMounted) return null;

  return (
    <Container maxW="container.xl" py={8}>
      <HStack justify="flex-end" mb={6} flexWrap="wrap" gap={4}>
        <Button
          size="sm"
          colorScheme="orange"
          onClick={() => router.push("/admin/revisao")}
        >
          <IoBarcode style={{ marginRight: 6 }} />
          Bipagem de Produtos
        </Button>
      </HStack>

      <Box>
        <ProductList
          products={products}
          isLoading={isLoading}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          onAdd={handleAdd}
          onInventoryChange={() => refetch()}
        />

        {totalPages > 1 && (
          <HStack justify="center" mt={8} gap={4}>
            <Button
              size="sm"
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <IoChevronBack /> Anterior
            </Button>

            <Text fontSize="sm" fontWeight="medium">
              Página {page} de {totalPages}
            </Text>

            <Button
              size="sm"
              variant="outline"
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Próxima <IoChevronForward />
            </Button>
          </HStack>
        )}
      </Box>

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
