import { Container, Heading } from "@chakra-ui/react";
import { requireAdminSession } from "@/app/services/require-admin-session";
import { EnrichmentForm } from "./enrichment-form";

export default async function EnrichPendingProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminSession();
  const id = (await params).id;

  return (
    <Container maxW="container.xl" py={8}>
      <Heading size="lg" mb={6}>
        Enriquecer Produto: {id}
      </Heading>
      <EnrichmentForm barcode={id} />
    </Container>
  );
}
