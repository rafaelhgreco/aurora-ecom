/**
 * Componente: Order Card
 *
 * Fallback mobile de OrderTable (abaixo de md).
 */

"use client";

import {
  Badge,
  Box,
  Button,
  Card,
  HStack,
  Popover,
  Portal,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  IoAlertCircleOutline,
  IoCheckmarkCircleOutline,
} from "react-icons/io5";
import { formatDateTime, formatPrice } from "@/app/utils/price-formatter";
import type { OrderStatus, OrderWithStock } from "@/core/schemas/order.schema";
import {
  hasStockIssue,
  itemsPreview,
  STATUS_COLORS,
  STATUS_LABELS,
} from "./order-utils";

interface OrderCardProps {
  order: OrderWithStock;
  updatingId: string | null;
  onStatusChange: (orderId: string, status: OrderStatus) => void;
  onDeclineClick: (orderId: string) => void;
}

export function OrderCard({
  order,
  updatingId,
  onStatusChange,
  onDeclineClick,
}: OrderCardProps) {
  const id = order.id ?? "";
  const isUpdating = updatingId === id;

  return (
    <Card.Root variant="outline">
      <Card.Body>
        <VStack align="stretch" gap={3}>
          <HStack justify="space-between">
            <Text fontFamily="mono" fontSize="xs" color="gray.500">
              #{id.slice(-8)}
            </Text>
            <Badge colorScheme={STATUS_COLORS[order.status]}>
              {STATUS_LABELS[order.status]}
            </Badge>
          </HStack>

          <Text fontSize="sm" color="gray.600">
            {formatDateTime(order.createdAt)}
          </Text>

          <Text fontSize="sm" lineClamp={2} title={itemsPreview(order)}>
            {itemsPreview(order)}
          </Text>

          <HStack justify="space-between">
            <Text fontWeight="semibold" fontSize="lg" color="green.600">
              {formatPrice(order.total)}
            </Text>

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
                  {hasStockIssue(order) && order.status === "PENDENTE" ? (
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
                            {i.variants?.size ? ` (${i.variants.size})` : ""}:{" "}
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
          </HStack>

          {order.status === "PENDENTE" && (
            <VStack align="stretch" gap={2}>
              <Button
                type="button"
                size="sm"
                colorScheme="green"
                loading={isUpdating}
                onClick={() => onStatusChange(id, "FINALIZADA")}
              >
                Finalizar
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                colorScheme="red"
                loading={isUpdating}
                onClick={() => onStatusChange(id, "DECLINADA")}
              >
                Declinar
              </Button>
            </VStack>
          )}

          {order.status === "FINALIZADA" && (
            <VStack align="stretch" gap={2}>
              <Button
                type="button"
                size="sm"
                variant="outline"
                colorScheme="blue"
                loading={isUpdating}
                onClick={() => onStatusChange(id, "PENDENTE")}
              >
                Reabrir
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                colorScheme="red"
                loading={isUpdating}
                onClick={() => onDeclineClick(id)}
              >
                Alterar para Declinada
              </Button>
            </VStack>
          )}
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}
