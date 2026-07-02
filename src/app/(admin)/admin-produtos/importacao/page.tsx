/**
 * Cadastro de produtos em massa via planilha Excel (.xlsx)
 */

"use client";

import {
  Box,
  Button,
  Card,
  Container,
  Heading,
  HStack,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  IoArrowBack,
  IoCloudDownload,
  IoCloudUpload,
  IoDocumentText,
} from "react-icons/io5";
import {
  generateBulkImportTemplateAction,
  parseAndValidateBulkImportAction,
} from "@/app/actions/bulk-import";
import { BulkImportErrors } from "@/app/components/admin/bulk-import/bulk-import-errors";
import { BulkImportPreview } from "@/app/components/admin/bulk-import/bulk-import-preview";
import { useBulkImport } from "@/app/hooks/use-bulk-import";
import { Alert } from "@/components/ui/alert";
import { ProgressBar, ProgressRoot } from "@/components/ui/progress";
import { toaster } from "@/components/ui/toaster";

function downloadBase64File(base64: string, fileName: string) {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const blob = new Blob([bytes], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadErrorCsv(errors: Array<{ sku_base: string; error: string }>) {
  const header = "sku_base,erro\n";
  const rows = errors
    .map(
      (e) =>
        `"${e.sku_base.replace(/"/g, '""')}","${e.error.replace(/"/g, '""')}"`,
    )
    .join("\n");
  const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "aurora-importacao-erros.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function BulkImportPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const {
    phase,
    validation,
    progress,
    summary,
    error,
    reset,
    setPreview,
    runImport,
  } = useBulkImport();

  const handleDownloadTemplate = async () => {
    setIsDownloading(true);
    const result = await generateBulkImportTemplateAction();
    setIsDownloading(false);

    if (!result.success) {
      toaster.create({
        title: "Erro",
        description: result.error,
        type: "error",
        duration: 5000,
      });
      return;
    }

    downloadBase64File(result.data.base64, result.data.fileName);
    toaster.create({
      title: "Template baixado",
      type: "success",
      duration: 3000,
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsValidating(true);
    const formData = new FormData();
    formData.append("file", file);
    const result = await parseAndValidateBulkImportAction(formData);
    setIsValidating(false);
    e.target.value = "";

    if (!result.success) {
      toaster.create({
        title: "Erro na validação",
        description: result.error,
        type: "error",
        duration: 5000,
      });
      return;
    }

    setPreview(result.data);
    toaster.create({
      title: "Planilha processada",
      description: `${result.data.readyCount} produto(s) prontos para importar`,
      type: result.data.readyCount > 0 ? "success" : "warning",
      duration: 4000,
    });
  };

  const handleConfirmImport = async () => {
    if (!validation?.readyCount) return;
    await runImport();
  };

  return (
    <Container maxW="container.xl" py={8}>
      <HStack justify="space-between" mb={6} flexWrap="wrap" gap={3}>
        <Box>
          <Heading size="2xl">Importação em Massa</Heading>
          <Text color="gray.600" mt={2}>
            Cadastre vários produtos via planilha Excel (.xlsx)
          </Text>
        </Box>
        <Button
          variant="outline"
          onClick={() => router.push("/admin-produtos")}
        >
          <IoArrowBack />
          Voltar
        </Button>
      </HStack>

      {error && (
        <Alert status="error" title="Erro" mb={4}>
          {error}
        </Alert>
      )}

      {phase === "idle" && (
        <VStack gap={6} align="stretch">
          <Card.Root>
            <Card.Header>
              <Heading size="lg">1. Baixar modelo</Heading>
            </Card.Header>
            <Card.Body>
              <Text color="gray.600" mb={4}>
                O template inclui instruções, colunas de estoque (roupas,
                volumes e custom) e exemplos preenchidos.
              </Text>
              <Button
                colorPalette="blue"
                onClick={handleDownloadTemplate}
                loading={isDownloading}
              >
                <IoCloudDownload />
                Baixar modelo (.xlsx)
              </Button>
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Header>
              <Heading size="lg">2. Enviar planilha</Heading>
            </Card.Header>
            <Card.Body>
              <Text color="gray.600" mb={4}>
                Faça o pré-upload das imagens no Cloudinary e informe URLs ou
                public_id na coluna imagens_cor.
              </Text>
              <Input
                ref={fileRef}
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                display="none"
                onChange={handleFileChange}
              />
              <Button
                colorPalette="blue"
                variant="outline"
                onClick={() => fileRef.current?.click()}
                loading={isValidating}
              >
                <IoCloudUpload />
                {isValidating ? "Validando..." : "Selecionar planilha"}
              </Button>
            </Card.Body>
          </Card.Root>
        </VStack>
      )}

      {(phase === "preview" || phase === "importing") && validation && (
        <VStack gap={6} align="stretch">
          <Card.Root>
            <Card.Header>
              <HStack justify="space-between" flexWrap="wrap">
                <Heading size="lg">Validação</Heading>
                <HStack>
                  <Text fontSize="sm" color="gray.600">
                    {validation.readyCount} prontos ·{" "}
                    {validation.rowErrors.length +
                      validation.groupErrors.length}{" "}
                    erros
                  </Text>
                  <Button size="sm" variant="ghost" onClick={reset}>
                    Nova planilha
                  </Button>
                </HStack>
              </HStack>
            </Card.Header>
            <Card.Body>
              <BulkImportErrors
                rowErrors={validation.rowErrors}
                groupErrors={validation.groupErrors}
              />
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Header>
              <Heading size="lg">
                Preview ({validation.products.length})
              </Heading>
            </Card.Header>
            <Card.Body>
              <BulkImportPreview products={validation.products} />
            </Card.Body>
          </Card.Root>

          {phase === "importing" && (
            <Card.Root>
              <Card.Body>
                <Text mb={2}>
                  Importando {progress.done} de {progress.total}...
                </Text>
                <ProgressRoot
                  value={
                    progress.total > 0
                      ? (progress.done / progress.total) * 100
                      : 0
                  }
                >
                  <ProgressBar />
                </ProgressRoot>
              </Card.Body>
            </Card.Root>
          )}

          {phase === "preview" && (
            <HStack justify="flex-end">
              <Button variant="outline" onClick={reset}>
                Cancelar
              </Button>
              <Button
                colorPalette="blue"
                disabled={validation.readyCount === 0}
                onClick={handleConfirmImport}
              >
                Confirmar importação ({validation.readyCount})
              </Button>
            </HStack>
          )}
        </VStack>
      )}

      {phase === "done" && summary && (
        <Card.Root>
          <Card.Header>
            <Heading size="lg">Importação concluída</Heading>
          </Card.Header>
          <Card.Body>
            <VStack align="stretch" gap={4}>
              <Text>
                <strong>{summary.success}</strong> produto(s) criados ·{" "}
                <strong>{summary.failed}</strong> falha(s) · total{" "}
                {summary.total}
              </Text>
              {summary.jobId && (
                <Text fontSize="sm" color="gray.500">
                  Registro: {summary.jobId}
                </Text>
              )}
              {summary.errors.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  w="fit-content"
                  onClick={() => downloadErrorCsv(summary.errors)}
                >
                  <IoDocumentText />
                  Baixar relatório de erros (CSV)
                </Button>
              )}
              <HStack>
                <Button onClick={() => router.push("/admin-produtos")}>
                  Ver produtos
                </Button>
                <Button variant="outline" onClick={reset}>
                  Nova importação
                </Button>
              </HStack>
            </VStack>
          </Card.Body>
        </Card.Root>
      )}
    </Container>
  );
}
