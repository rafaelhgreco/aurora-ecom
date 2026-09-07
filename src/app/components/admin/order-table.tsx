/**
 * Componente: Order Table
 *
 * Tabela de pedidos com filtro por status e ações (Finalizar/Declinar).
 * Responsiva e alinhada ao padrão do ProductTable.
 */

"use client";

import {
  Badge,
  Box,
  Button,
  HStack,
  Popover,
  Portal,
  Table,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  IoAlertCircleOutline,
  IoCheckmarkCircleOutline,
  IoChevronBack,
  IoChevronForward,
  IoRefresh,
} from "react-icons/io5";
import {
  listOrdersWithStockAction,
  updateOrderStatusAction,
} from "@/app/actions/orders";
import { formatDateTime, formatPrice } from "@/app/utils/price-formatter";
import { toaster } from "@/components/ui/toaster";
import type { OrderStatus, OrderWithStock } from "@/core/schemas/order.schema";
import { EmptyState } from "../states/empty-state";
import { LoadingState } from "../states/loading-state";
import { DeclineFinishedOrderDialog } from "./decline-finished-order-dialog";

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDENTE: "Pendente",
  DECLINADA: "Declinada",
  FINALIZADA: "Finalizada",
};

const STATUS_COLORS: Record<OrderStatus, "yellow" | "red" | "green"> = {
  PENDENTE: "yellow",
  DECLINADA: "red",
  FINALIZADA: "green",
};

type FilterStatus = OrderStatus | "TODOS";

export function OrderTable() {
  const queryClient = useQueryClient();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterStatus>("TODOS");
  const [declineConfirmOrderId, setDeclineConfirmOrderId] = useState<
    string | null
  >(null);
  const [page, setPage] = useState(1);
  const limit = 10;

  const handleFilterChange = (f: FilterStatus) => {
    setFilter(f);
    setPage(1);
  };

  const {
    data: result,
    isFetching,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["orders", filter, page],
    queryFn: async () => {
      const res = await listOrdersWithStockAction({
        limitCount: limit,
        page,
        status: filter === "TODOS" ? undefined : filter,
      });
      if (!res.success) {
        throw new Error(res.error || "Erro ao carregar pedidos");
      }
      return res.data;
    },
  });

  const orders = result?.data || [];
  const totalCount = result?.totalCount || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));
  const isRefreshing = isFetching && !isLoading;

  const handleStatusChange = async (
    orderId: string,
    newStatus: OrderStatus,
  ) => {
    setUpdatingId(orderId);
    const result = await updateOrderStatusAction(orderId, newStatus);
    setUpdatingId(null);

    if (result.success) {
      await queryClient.invalidateQueries({ queryKey: ["orders"] });
      const desc =
        newStatus === "DECLINADA"
          ? "Pedido declinado e estoque devolvido."
          : newStatus === "FINALIZADA"
            ? "Pedido finalizado."
            : newStatus === "PENDENTE"
              ? "Pedido reaberto."
              : undefined;
      if (desc) {
        toaster.create({
          title: "Status atualizado",
          description: desc,
          type: "success",
          duration: 3000,
        });
      }
    } else {
      const errMsg =
        !result.success && "error" in result
          ? result.error
          : "Erro ao atualizar status";
      toaster.create({
        title: "Erro",
        description: errMsg,
        type: "error",
        duration: 5000,
      });
    }
  };

  const itemsPreview = (order: OrderWithStock) =>
    order.items
      .map((i) => {
        const variant =
          i.variants?.size || i.variants?.color
            ? ` (${[i.variants.size, i.variants.color].filter(Boolean).join(", ")})`
            : "";
        return `${i.quantity}x ${i.title}${variant}`;
      })
      .join(", ");

  const hasStockIssue = (order: OrderWithStock) =>
    order.items.some((i) => !i.sufficient);

  if (isLoading) {
    return <LoadingState minHeight="200px" fullPage={false} />;
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        title="Nenhum pedido"
        description={
          filter === "TODOS"
            ? "Os pedidos aparecerão aqui quando clientes finalizarem pelo WhatsApp."
            : `Nenhum pedido com status "${STATUS_LABELS[filter]}".`
        }
        fullPage={false}
      />
    );
  }

  return (
    <Box>
      <HStack gap={2} mb={6} flexWrap="wrap" justify="space-between">
        <HStack gap={2} flexWrap="wrap">
          {(["TODOS", "PENDENTE", "DECLINADA", "FINALIZADA"] as const).map(
            (f) => (
              <Button
                key={f}
                size="sm"
                variant={filter === f ? "solid" : "outline"}
                colorScheme={
                  f === "TODOS" ? "gray" : STATUS_COLORS[f as OrderStatus]
                }
                onClick={() => handleFilterChange(f)}
              >
                {f === "TODOS" ? "Todos" : STATUS_LABELS[f as OrderStatus]}
              </Button>
            ),
          )}
        </HStack>
        <Button
          size="sm"
          colorScheme="green"
          loading={isRefreshing}
          onClick={() => refetch()}
        >
          <IoRefresh style={{ marginRight: "6px" }} />
          Atualizar
        </Button>
      </HStack>

      <Box borderWidth="1px" borderRadius="md" overflowX="auto" bg="white">
        <Table.Root size="sm" variant="outline">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>Pedido</Table.ColumnHeader>
              <Table.ColumnHeader>Data</Table.ColumnHeader>
              <Table.ColumnHeader>Itens</Table.ColumnHeader>
              <Table.ColumnHeader>Estoque</Table.ColumnHeader>
              <Table.ColumnHeader>Total</Table.ColumnHeader>
              <Table.ColumnHeader>Status</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="end">Ações</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {orders.map((order) => {
              const id = order.id ?? "";
              return (
                <Table.Row key={id}>
                  <Table.Cell>
                    <Text fontFamily="mono" fontSize="xs">
                      #{id.slice(-8)}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text fontSize="sm">{formatDateTime(order.createdAt)}</Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text
                      fontSize="sm"
                      maxW={{ base: "120px", md: "220px" }}
                      lineClamp={2}
                      title={itemsPreview(order)}
                    >
                      {itemsPreview(order)}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Popover.Root positioning={{ gutter: 4 }}>
                      <Popover.Trigger asChild>
                        <Button
                          variant="ghost"
                          size="xs"
                          p="0"
                          minW="auto"
                          h="auto"
                          title="Clique para ver estoque por item"
                        >
                          {hasStockIssue(order) &&
                          order.status === "PENDENTE" ? (
                            <Badge colorScheme="orange" fontSize="xs">
                              <HStack gap="1">
                                <IoAlertCircleOutline size={12} />
                                <Text as="span">Verificar</Text>
                              </HStack>
                            </Badge>
                          ) : (
                            <Badge colorScheme="green" fontSize="xs">
                              <HStack gap="1">
                                <IoCheckmarkCircleOutline size={12} />
                                <Text as="span">OK</Text>
                              </HStack>
                            </Badge>
                          )}
                        </Button>
                      </Popover.Trigger>
                      <Portal>
                        <Popover.Positioner>
                          <Popover.Content>
                            <Popover.Arrow>
                              <Popover.ArrowTip />
                            </Popover.Arrow>
                            <Box p="3" maxW="320px">
                              <Text fontWeight="semibold" mb="2" fontSize="sm">
                                Estoque por item
                              </Text>
                              <VStack align="stretch" gap="1" fontSize="xs">
                                {order.items.map((i, idx) => (
                                  <Text
                                    key={`${i.productId}-${i.variants?.size ?? ""}-${idx}`}
                                  >
                                    <Text as="span" fontWeight="bold">
                                      {i.quantity}
                                    </Text>
                                    x {i.title}
                                    {i.variants?.size
                                      ? ` (${i.variants.size})`
                                      : ""}
                                    :{" "}
                                    <Text as="span" fontWeight="bold">
                                      {i.currentStock}
                                    </Text>{" "}
                                    em estoque{" "}
                                    {i.sufficient ? (
                                      <IoCheckmarkCircleOutline
                                        color="var(--chakra-colors-green-600)"
                                        style={{
                                          display: "inline",
                                          verticalAlign: "middle",
                                        }}
                                      />
                                    ) : (
                                      <>
                                        — insuficiente{" "}
                                        <IoAlertCircleOutline
                                          color="var(--chakra-colors-orange-600)"
                                          style={{
                                            display: "inline",
                                            verticalAlign: "middle",
                                          }}
                                        />
                                      </>
                                    )}
                                  </Text>
                                ))}
                              </VStack>
                            </Box>
                          </Popover.Content>
                        </Popover.Positioner>
                      </Portal>
                    </Popover.Root>
                  </Table.Cell>
                  <Table.Cell>
                    <Text fontWeight="semibold" color="green.600">
                      {formatPrice(order.total)}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge colorScheme={STATUS_COLORS[order.status]}>
                      {STATUS_LABELS[order.status]}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell textAlign="end" whiteSpace="nowrap">
                    <HStack gap={2} justify="flex-end" flexWrap="nowrap">
                      {order.status === "PENDENTE" && (
                        <>
                          <Button
                            type="button"
                            size="xs"
                            colorScheme="green"
                            loading={updatingId === id}
                            onClick={() => handleStatusChange(id, "FINALIZADA")}
                          >
                            Finalizar
                          </Button>
                          <Button
                            type="button"
                            size="xs"
                            variant="outline"
                            colorScheme="red"
                            loading={updatingId === id}
                            onClick={() => handleStatusChange(id, "DECLINADA")}
                          >
                            Declinar
                          </Button>
                        </>
                      )}
                      {order.status === "FINALIZADA" && (
                        <>
                          <Button
                            type="button"
                            size="xs"
                            variant="outline"
                            colorScheme="blue"
                            loading={updatingId === id}
                            onClick={() => handleStatusChange(id, "PENDENTE")}
                          >
                            Reabrir
                          </Button>
                          <Button
                            type="button"
                            size="xs"
                            variant="outline"
                            colorScheme="red"
                            loading={updatingId === id}
                            onClick={() => setDeclineConfirmOrderId(id)}
                          >
                            Alterar para Declinada
                          </Button>
                        </>
                      )}
                      {order.status === "DECLINADA" && (
                        <Text fontSize="xs" color="gray.500">
                          —
                        </Text>
                      )}
                    </HStack>
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table.Root>
      </Box>

      {totalPages > 1 && (
        <HStack justify="center" mt={6} gap={4}>
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

      <DeclineFinishedOrderDialog
        orderId={declineConfirmOrderId}
        isConfirmLoading={
          !!declineConfirmOrderId && updatingId === declineConfirmOrderId
        }
        cancelDisabled={!!updatingId}
        onCancel={() => setDeclineConfirmOrderId(null)}
        onConfirm={async () => {
          const orderId = declineConfirmOrderId;
          if (!orderId) return;
          setDeclineConfirmOrderId(null);
          await handleStatusChange(orderId, "DECLINADA");
        }}
      />
    </Box>
  );
}
