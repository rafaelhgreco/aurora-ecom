/**
 * Breadcrumb em botões: mesmas seções que `SHOP` no drawer (multisseleção).
 */

import { Button, Flex, Text, Wrap, WrapItem } from "@chakra-ui/react";

export interface ShopCategoryBreadcrumbRoute {
  slug: string;
  shopCategory: string;
  title: string;
}

export interface ShopCategoryBreadcrumbProps {
  routes: readonly ShopCategoryBreadcrumbRoute[];
  /** Categorias ativas; vazio = mostrar todos os produtos (sem filtro). */
  selectedIds: ReadonlySet<string>;
  onToggle: (id: string) => void;
  onClearAll: () => void;
}

export function ShopCategoryBreadcrumb({
  routes,
  selectedIds,
  onToggle,
  onClearAll,
}: ShopCategoryBreadcrumbProps) {
  const hasFilter = selectedIds.size > 0;

  return (
    <Flex direction="column" gap={3} w="full">
      <Text fontSize="sm" fontWeight="medium" color="gray.600">
        Filtrar por categoria
        {!hasFilter && (
          <Text as="span" fontWeight="normal" color="gray.500" ml={1}>
            (nenhuma selecionada — exibindo todos os produtos)
          </Text>
        )}
      </Text>
      <Wrap gap={2}>
        <WrapItem>
          <Button
            size="sm"
            variant={!hasFilter ? "solid" : "outline"}
            colorScheme="gray"
            onClick={onClearAll}
            aria-pressed={!hasFilter}
            disabled={!hasFilter}
          >
            Todos
          </Button>
        </WrapItem>
        {routes.map((route) => {
          const active = selectedIds.has(route.shopCategory);
          return (
            <WrapItem key={route.slug}>
              <Button
                size="sm"
                variant={active ? "solid" : "outline"}
                colorScheme={active ? "blue" : "gray"}
                onClick={() => onToggle(route.shopCategory)}
                aria-pressed={active}
              >
                {route.title}
              </Button>
            </WrapItem>
          );
        })}
      </Wrap>
    </Flex>
  );
}
