/**
 * Página: Admin — Gerenciar produtos de uma subcategoria
 *
 * Lista os produtos vinculados a uma subcategoria e permite mover/limpar em
 * massa (checkbox + "selecionar todos" + destino), para liberar a exclusão
 * da subcategoria ou reorganizar o catálogo sem editar produto por produto.
 */

"use client";

import {
  Box,
  Breadcrumb,
  Button,
  Container,
  Heading,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { IoArrowBack, IoChevronBack, IoChevronForward } from "react-icons/io5";
import { BulkMoveCategoryBar } from "@/app/components/admin/bulk-move-category-bar";
import { BulkMoveCategoryConfirmDialog } from "@/app/components/admin/bulk-move-category-confirm-dialog";
import { CategoryProductsCard } from "@/app/components/admin/category-products-card";
import { CategoryProductsTable } from "@/app/components/admin/category-products-table";
import { EmptyState } from "@/app/components/states/empty-state";
import { LoadingState } from "@/app/components/states/loading-state";
import { useCategories } from "@/app/hooks/use-categories";
import {
  CATEGORY_PRODUCTS_PAGE_SIZE,
  useCategoryProductsBulkMove,
} from "@/app/hooks/use-category-products-bulk-move";
import { useSections } from "@/app/hooks/use-sections";
import { toaster } from "@/components/ui/toaster";

const NO_CATEGORY_VALUE = "";

export default function AdminCategoryProductsPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const { categories, loading: categoriesLoading } = useCategories();
  const { sections, loading: sectionsLoading } = useSections();

  const category = categories.find((c) => c.id === id);
  const section = category
    ? sections.find((s) => s.id === category.sectionId)
    : undefined;

  const [page, setPage] = useState(1);

  const {
    products,
    totalCount,
    isLoading,
    isFetchingNextPage,
    isMutating,
    error,
    bulkMove,
  } = useCategoryProductsBulkMove(category?.name ?? "", page);

  const totalPages = Math.max(
    1,
    Math.ceil(totalCount / CATEGORY_PRODUCTS_PAGE_SIZE),
  );

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [destination, setDestination] = useState<string>(NO_CATEGORY_VALUE);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    const currentIds = new Set(products.map((p) => p.id as string));
    setSelectedIds((prev) => {
      const next = new Set([...prev].filter((id) => currentIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [products]);

  const handleToggle = (productId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const handleToggleAll = () => {
    setSelectedIds((prev) => {
      if (prev.size === products.length) {
        return new Set();
      }
      return new Set(products.map((p) => p.id as string));
    });
  };

  const handleApply = () => {
    if (selectedIds.size === 0) return;
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    const result = await bulkMove([...selectedIds], destination);
    if (result.success) {
      toaster.create({
        title: "Sucesso",
        description:
          destination === NO_CATEGORY_VALUE
            ? "Subcategoria removida dos produtos selecionados."
            : "Produtos movidos com sucesso.",
        type: "success",
        duration: 3000,
      });
      setConfirmOpen(false);
      setSelectedIds(new Set());
      setPage(1);
    } else {
      toaster.create({
        title: "Erro",
        description: result.error || "Erro ao mover produtos",
        type: "error",
        duration: 5000,
      });
    }
  };

  if (!mounted) return null;

  if (!id) {
    return (
      <Container maxW="container.lg" py={8}>
        <Text>Subcategoria não encontrada.</Text>
        <Button mt={4} onClick={() => router.push("/admin/categorias")}>
          Voltar
        </Button>
      </Container>
    );
  }

  if ((categoriesLoading || sectionsLoading) && !category) {
    return (
      <Box py={8}>
        <LoadingState />
      </Box>
    );
  }

  if (!category) {
    return (
      <Container maxW="container.lg" py={8}>
        <Text color="red.600">Subcategoria não encontrada.</Text>
        <Button mt={4} onClick={() => router.push("/admin/categorias")}>
          <IoArrowBack style={{ marginRight: 8 }} />
          Voltar
        </Button>
      </Container>
    );
  }

  const destinationOptions = [
    ...categories
      .filter((c) => c.sectionId === category.sectionId && c.id !== category.id)
      .map((c) => ({ label: c.name, value: c.name })),
    { label: "Nenhuma", value: NO_CATEGORY_VALUE },
  ];

  return (
    <Container maxW="container.lg" py={8}>
      <VStack align="stretch" gap={4} mb={6}>
        <Breadcrumb.Root>
          <Breadcrumb.List>
            <Breadcrumb.Item>
              <Breadcrumb.Link
                onClick={() => router.push("/admin/categorias")}
                cursor="pointer"
              >
                Categorias
              </Breadcrumb.Link>
            </Breadcrumb.Item>
            {section && (
              <Breadcrumb.Item>
                <Breadcrumb.CurrentLink>{section.name}</Breadcrumb.CurrentLink>
              </Breadcrumb.Item>
            )}
            <Breadcrumb.Item>
              <Breadcrumb.CurrentLink>{category.name}</Breadcrumb.CurrentLink>
            </Breadcrumb.Item>
          </Breadcrumb.List>
        </Breadcrumb.Root>

        <Heading size="lg">Gerenciar produtos — {category.name}</Heading>
        <Text color="gray.500" fontSize="sm">
          Selecione produtos e mova-os para outra subcategoria, ou limpe para
          "Nenhuma" — necessário para poder excluir esta subcategoria.
        </Text>
      </VStack>

      {isLoading ? (
        <LoadingState minHeight="200px" />
      ) : error ? (
        <Text color="red.600">{error}</Text>
      ) : totalCount === 0 ? (
        <EmptyState
          fullPage={false}
          title="Nenhum produto nesta subcategoria"
          description="Esta subcategoria já pode ser excluída na página de categorias."
        />
      ) : (
        <VStack align="stretch" gap={4}>
          <BulkMoveCategoryBar
            selectedCount={selectedIds.size}
            destinationOptions={destinationOptions}
            destination={destination}
            onDestinationChange={setDestination}
            onApply={handleApply}
          />

          <Box
            opacity={isFetchingNextPage ? 0.6 : 1}
            transition="opacity 0.15s"
          >
            <CategoryProductsTable
              products={products}
              selectedIds={selectedIds}
              onToggle={handleToggle}
              onToggleAll={handleToggleAll}
            />

            <VStack
              align="stretch"
              gap={3}
              display={{ base: "flex", md: "none" }}
            >
              {products.map((product) => (
                <CategoryProductsCard
                  key={product.id}
                  product={product}
                  selected={selectedIds.has(product.id as string)}
                  onToggle={handleToggle}
                />
              ))}
            </VStack>
          </Box>

          {totalPages > 1 && (
            <HStack justify="center" gap={4}>
              <Button
                size="sm"
                variant="outline"
                disabled={page === 1 || isFetchingNextPage}
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
                disabled={page === totalPages || isFetchingNextPage}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Próxima <IoChevronForward />
              </Button>
            </HStack>
          )}
        </VStack>
      )}

      <BulkMoveCategoryConfirmDialog
        open={confirmOpen}
        count={selectedIds.size}
        destinationLabel={
          destination === NO_CATEGORY_VALUE
            ? "Nenhuma"
            : (destinationOptions.find((o) => o.value === destination)?.label ??
              destination)
        }
        isClear={destination === NO_CATEGORY_VALUE}
        isLoading={isMutating}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </Container>
  );
}
