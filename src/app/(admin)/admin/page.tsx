/**
 * Página: Admin
 *
 * CRUD de produtos.
 */

"use client";

import { Box, Button, Container, HStack } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { IoBarcode } from "react-icons/io5";
import { DeleteConfirmDialog } from "@/app/components/admin/delete-confirm-dialog";
import { ProductFiltersBar } from "@/app/components/admin/product-filters-bar";
import { ProductList } from "@/app/components/admin/product-list";
import { ProductViewDialog } from "@/app/components/admin/product-view-dialog";
import { Pagination } from "@/app/components/shared/pagination";
import { useAdminProducts } from "@/app/hooks/use-admin-products";
import { useCategories } from "@/app/hooks/use-categories";
import { useProductCRUD } from "@/app/hooks/use-product-crud";
import { useSections } from "@/app/hooks/use-sections";
import type { Product } from "@/app/types/product";
import { toaster } from "@/components/ui/toaster";

export default function AdminProductsPage() {
  const router = useRouter();
  const { deleteProduct } = useProductCRUD();

  const { sections } = useSections();
  const { categories } = useCategories();

  const [page, setPage] = useState(1);
  const [sectionId, setSectionId] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const limit = 20;

  const {
    products,
    totalCount,
    totalPages,
    loading: isLoading,
    error: queryError,
    refetch,
  } = useAdminProducts({
    page,
    limitCount: limit,
    shopCategory: sectionId || undefined,
    category: categoryName || undefined,
  });

  const handleSectionChange = (value: string) => {
    setSectionId(value);
    setPage(1);
  };

  const handleCategoryChange = (value: string) => {
    setCategoryName(value);
    setPage(1);
  };

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
        description: queryError || "Erro ao carregar produtos",
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
        <ProductFiltersBar
          sections={sections}
          categories={categories}
          sectionId={sectionId}
          onSectionChange={handleSectionChange}
          categoryName={categoryName}
          onCategoryChange={handleCategoryChange}
        />

        <ProductList
          products={products}
          isLoading={isLoading}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          onAdd={handleAdd}
          onInventoryChange={() => refetch()}
        />

        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalCount={totalCount}
          pageSize={limit}
        />
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
