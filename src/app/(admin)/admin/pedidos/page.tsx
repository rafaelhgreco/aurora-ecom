/**
 * Página: Admin — Pedidos
 */

"use client";

import { Container } from "@chakra-ui/react";
import { OrderTable } from "@/app/components/admin/order-table";

export default function AdminOrdersPage() {
  return (
    <Container maxW="container.xl" py={8}>
      <OrderTable />
    </Container>
  );
}
