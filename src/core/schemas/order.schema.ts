/**
 * Schema e tipos para pedidos (orders)
 */

export const ORDER_STATUSES = ["PENDENTE", "DECLINADA", "FINALIZADA"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface OrderItem {
  productId: string;
  quantity: number;
  variants?: { size?: string; color?: string };
  /** Título do produto no momento do pedido */
  title: string;
  /** Preço unitário no momento do pedido */
  price: number;
  subtotal: number;
}

/** Item enriquecido com estoque atual (para exibição no admin) */
export interface OrderItemWithStock extends OrderItem {
  currentStock: number;
  sufficient: boolean;
}

/** Pedido com itens enriquecidos com estoque */
export interface OrderWithStock extends Order {
  items: OrderItemWithStock[];
}

export interface Order {
  id?: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt?: Date;
  updatedAt?: Date;
}
