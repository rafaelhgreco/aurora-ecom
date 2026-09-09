/**
 * Página: Admin — Gerenciar produtos de uma promoção (client)
 *
 * Mirror de `AdminCategoryProductsPage`, com uma diferença: a tela de
 * categoria só lista produtos já pertencentes à categoria (a associação
 * inicial acontece no formulário de edição do produto). Como não há campo de
 * promoção no formulário de produto — a associação é feita só por aqui — uma
 * promoção recém-criada (zero produtos) precisa de um jeito de ganhar
 * produtos. Por isso o toggle "Todos os produtos" / "Nesta promoção": em
 * "Todos" lista o catálogo inteiro (paginado) para selecionar quem entra.
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
import { BulkAssignPromotionConfirmDialog } from "@/app/components/admin/bulk-assign-promotion-confirm-dialog";
import { BulkMoveCategoryBar } from "@/app/components/admin/bulk-move-category-bar";
import { PromotionProductsCard } from "@/app/components/admin/promotion-products-card";
import { PromotionProductsTable } from "@/app/components/admin/promotion-products-table";
import { EmptyState } from "@/app/components/states/empty-state";
import { LoadingState } from "@/app/components/states/loading-state";
import {
  PROMOTION_PRODUCTS_PAGE_SIZE,
  type PromotionProductsScope,
  usePromotionProductsBulkAssign,
} from "@/app/hooks/use-promotion-products-bulk-assign";
import { usePromotions } from "@/app/hooks/use-promotions";
import { toaster } from "@/components/ui/toaster";

const NO_PROMOTION_VALUE = "";

export function PromotionProductsPageClient() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const { promotions, loading: promotionsLoading } = usePromotions();
  const promotion = promotions.find((p) => p.id === id);

  const [scope, setScope] = useState<PromotionProductsScope>("assigned");
  const [page, setPage] = useState(1);

  const {
    products,
    totalCount,
    isLoading,
    isFetchingNextPage,
    isMutating,
    error,
    bulkAssign,
    setOverridePrice,
  } = usePromotionProductsBulkAssign(promotion?.id ?? "", scope, page);

  const totalPages = Math.max(
    1,
    Math.ceil(totalCount / PROMOTION_PRODUCTS_PAGE_SIZE),
  );

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [destination, setDestination] = useState<string>(id);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    const currentIds = new Set(products.map((p) => p.id as string));
    setSelectedIds((prev) => {
      const next = new Set([...prev].filter((pid) => currentIds.has(pid)));
      return next.size === prev.size ? prev : next;
    });
  }, [products]);

  const handleScopeChange = (nextScope: PromotionProductsScope) => {
    setScope(nextScope);
    setPage(1);
    setSelectedIds(new Set());
  };

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
    const promotionId = destination === NO_PROMOTION_VALUE ? null : destination;
    const result = await bulkAssign([...selectedIds], promotionId);
    if (result.success) {
      toaster.create({
        title: "Sucesso",
        description:
          promotionId === null
            ? "Produtos removidos da promoção."
            : "Produtos associados à promoção.",
        type: "success",
        duration: 3000,
      });
      setConfirmOpen(false);
      setSelectedIds(new Set());
      setPage(1);
    } else {
      toaster.create({
        title: "Erro",
        description: result.error || "Erro ao atualizar produtos",
        type: "error",
        duration: 5000,
      });
    }
  };

  const handleSetOverridePrice = async (
    productId: string,
    overridePrice: number | null,
  ) => {
    const result = await setOverridePrice(productId, overridePrice);
    if (!result.success) {
      toaster.create({
        title: "Erro",
        description: result.error || "Erro ao definir valor base",
        type: "error",
        duration: 5000,
      });
    }
  };

  if (!mounted) return null;

  if (!id) {
    return (
      <Container maxW="container.lg" py={8}>
        <Text>Promoção não encontrada.</Text>
        <Button mt={4} onClick={() => router.push("/admin/promocoes")}>
          Voltar
        </Button>
      </Container>
    );
  }

  if (promotionsLoading && !promotion) {
    return (
      <Box py={8}>
        <LoadingState />
      </Box>
    );
  }

  if (!promotion) {
    return (
      <Container maxW="container.lg" py={8}>
        <Text color="red.600">Promoção não encontrada.</Text>
        <Button mt={4} onClick={() => router.push("/admin/promocoes")}>
          <IoArrowBack style={{ marginRight: 8 }} />
          Voltar
        </Button>
      </Container>
    );
  }

  const destinationOptions = [
    { label: `Aplicar a "${promotion.name}"`, value: promotion.id as string },
    { label: "Remover da promoção", value: NO_PROMOTION_VALUE },
  ];

  return (
    <Container maxW="container.lg" py={8}>
      <VStack align="stretch" gap={4} mb={6}>
        <Breadcrumb.Root>
          <Breadcrumb.List>
            <Breadcrumb.Item>
              <Breadcrumb.Link
                onClick={() => router.push("/admin/promocoes")}
                cursor="pointer"
              >
                Promoções
              </Breadcrumb.Link>
            </Breadcrumb.Item>
            <Breadcrumb.Item>
              <Breadcrumb.CurrentLink>{promotion.name}</Breadcrumb.CurrentLink>
            </Breadcrumb.Item>
          </Breadcrumb.List>
        </Breadcrumb.Root>

        <Heading size="lg">Gerenciar produtos — {promotion.name}</Heading>
        <Text color="gray.500" fontSize="sm">
          Selecione produtos para associar ou remover desta promoção. Para um
          produto já associado, defina opcionalmente um valor base — o
          percentual da promoção passa a incidir sobre ele em vez do preço de
          tabela.
        </Text>

        <HStack gap={2}>
          <Button
            size="sm"
            variant={scope === "assigned" ? "solid" : "outline"}
            colorScheme="blue"
            onClick={() => handleScopeChange("assigned")}
          >
            Nesta promoção
          </Button>
          <Button
            size="sm"
            variant={scope === "all" ? "solid" : "outline"}
            colorScheme="blue"
            onClick={() => handleScopeChange("all")}
          >
            Todos os produtos
          </Button>
        </HStack>
      </VStack>

      {isLoading ? (
        <LoadingState minHeight="200px" />
      ) : error ? (
        <Text color="red.600">{error}</Text>
      ) : totalCount === 0 ? (
        <EmptyState
          fullPage={false}
          title={
            scope === "assigned"
              ? "Nenhum produto nesta promoção"
              : "Nenhum produto cadastrado"
          }
          description={
            scope === "assigned"
              ? 'Use "Todos os produtos" para selecionar produtos e associá-los a esta promoção.'
              : "Cadastre produtos antes de associá-los a uma promoção."
          }
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
            <PromotionProductsTable
              products={products}
              promotionId={promotion.id as string}
              selectedIds={selectedIds}
              onToggle={handleToggle}
              onToggleAll={handleToggleAll}
              onSetOverridePrice={handleSetOverridePrice}
            />

            <VStack
              align="stretch"
              gap={3}
              display={{ base: "flex", md: "none" }}
            >
              {products.map((product) => (
                <PromotionProductsCard
                  key={product.id}
                  product={product}
                  promotionId={promotion.id as string}
                  selected={selectedIds.has(product.id as string)}
                  onToggle={handleToggle}
                  onSetOverridePrice={handleSetOverridePrice}
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

      <BulkAssignPromotionConfirmDialog
        open={confirmOpen}
        count={selectedIds.size}
        promotionName={promotion.name}
        isRemove={destination === NO_PROMOTION_VALUE}
        isLoading={isMutating}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </Container>
  );
}
