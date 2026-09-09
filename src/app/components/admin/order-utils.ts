import type { OrderStatus, OrderWithStock } from "@/core/schemas/order.schema";

export const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDENTE: "Pendente",
  DECLINADA: "Declinada",
  FINALIZADA: "Finalizada",
};

export const STATUS_COLORS: Record<OrderStatus, "yellow" | "red" | "green"> = {
  PENDENTE: "yellow",
  DECLINADA: "red",
  FINALIZADA: "green",
};

export function itemsPreview(order: OrderWithStock): string {
  return order.items
    .map((i) => {
      const variant =
        i.variants?.size || i.variants?.color
          ? ` (${[i.variants.size, i.variants.color].filter(Boolean).join(", ")})`
          : "";
      return `${i.quantity}x ${i.title}${variant}`;
    })
    .join(", ");
}

export function hasStockIssue(order: OrderWithStock): boolean {
  return order.items.some((i) => !i.sufficient);
}
