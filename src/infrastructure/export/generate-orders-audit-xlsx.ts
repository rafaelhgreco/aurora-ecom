import ExcelJS from "exceljs";
import { formatDateTime, formatPrice } from "@/app/utils/price-formatter";
import type { Order, OrderStatus } from "@/core/schemas/order.schema";

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDENTE: "Pendente",
  DECLINADA: "Declinada",
  FINALIZADA: "Finalizada",
};

const ORDERS_COLUMNS = [
  "ID",
  "Data de Criação",
  "Status",
  "Qtd. Itens",
  "Total",
] as const;

const ITEMS_COLUMNS = [
  "ID do Pedido",
  "Produto (ID)",
  "Título",
  "Quantidade",
  "Preço Unitário",
  "Subtotal",
  "Tamanho",
  "Cor",
] as const;

function styleHeaderRow(row: ExcelJS.Row) {
  row.font = { bold: true };
  row.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE2E8F0" },
  };
}

/**
 * Gera a planilha de auditoria com todos os pedidos (função pura, não
 * acessa o banco) — usada antes de apagar os pedidos em `clearAllOrdersAction`.
 */
export async function generateOrdersAuditXlsxBuffer(
  orders: Order[],
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Aurora E-Commerce";

  const ordersSheet = workbook.addWorksheet("Pedidos");
  ordersSheet.addRow([...ORDERS_COLUMNS]);
  styleHeaderRow(ordersSheet.getRow(1));
  const ordersColumnWidths = [24, 20, 14, 12, 16];
  ordersColumnWidths.forEach((width, idx) => {
    ordersSheet.getColumn(idx + 1).width = width;
  });
  ordersSheet.views = [{ state: "frozen", ySplit: 1 }];

  for (const order of orders) {
    ordersSheet.addRow([
      order.id ?? "",
      formatDateTime(order.createdAt),
      STATUS_LABELS[order.status] ?? order.status,
      order.items.length,
      formatPrice(order.total),
    ]);
  }

  const itemsSheet = workbook.addWorksheet("Itens");
  itemsSheet.addRow([...ITEMS_COLUMNS]);
  styleHeaderRow(itemsSheet.getRow(1));
  const itemsColumnWidths = [24, 24, 28, 12, 16, 16, 12, 12];
  itemsColumnWidths.forEach((width, idx) => {
    itemsSheet.getColumn(idx + 1).width = width;
  });
  itemsSheet.views = [{ state: "frozen", ySplit: 1 }];

  for (const order of orders) {
    for (const item of order.items) {
      itemsSheet.addRow([
        order.id ?? "",
        item.productId,
        item.title,
        item.quantity,
        formatPrice(item.price),
        formatPrice(item.subtotal),
        item.variants?.size ?? "",
        item.variants?.color ?? "",
      ]);
    }
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
