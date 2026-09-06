import { Box, Container, Heading, Table, Text } from "@chakra-ui/react";
import { requireAdminSession } from "@/app/services/require-admin-session";
import { getAdminDb } from "@/infrastructure/lib/firebase-admin";

export default async function PendentesPage() {
  const auth = await requireAdminSession();
  if ("error" in auth) {
    return <Text>Acesso negado</Text>;
  }

  const db = getAdminDb();
  let pendentes: any[] = [];

  if (db) {
    const snapshot = await db
      .collection("products")
      .where("status", "==", "DRAFT")
      .get();
    pendentes = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  }

  return (
    <Container maxW="container.xl" py={8}>
      <Heading size="lg" mb={6}>
        Produtos Pendentes de Revisão
      </Heading>

      {pendentes.length === 0 ? (
        <Box
          p={8}
          textAlign="center"
          borderWidth={1}
          borderRadius="md"
          bg="gray.50"
        >
          <Text data-testid="empty-state">Sem produtos pendentes</Text>
        </Box>
      ) : (
        <Box overflowX="auto">
          <Table.Root variant="outline">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Código de Barras</Table.ColumnHeader>
                <Table.ColumnHeader>Quantidade Bipada</Table.ColumnHeader>
                <Table.ColumnHeader>Data de Criação</Table.ColumnHeader>
                <Table.ColumnHeader>Ações</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {pendentes.map((p) => (
                <Table.Row key={p.id}>
                  <Table.Cell>{p.barcode || p.id}</Table.Cell>
                  <Table.Cell>{p.stock || 0}</Table.Cell>
                  <Table.Cell>
                    {p.createdAt
                      ? new Date(
                          p.createdAt._seconds * 1000,
                        ).toLocaleDateString()
                      : "N/A"}
                  </Table.Cell>
                  <Table.Cell>
                    <a href={`/admin-produtos/pendentes/${p.id}`}>Enriquecer</a>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Box>
      )}
    </Container>
  );
}
