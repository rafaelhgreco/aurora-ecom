/**
 * Página de Exemplo: Testando Server Actions
 *
 * Este arquivo demonstra como usar Server Actions sem API Routes.
 * Você verá como o fluxo é mais simples e type-safe.
 */

"use client";

import {
  Box,
  Button,
  Code,
  Container,
  Heading,
  HStack,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useState } from "react";
import {
  createProductAction,
  getProductByIdAction,
  listProductsAction,
  updateProductAction,
} from "@/app/actions/products";
import type {
  CreateProductInput,
  Product,
} from "@/core/schemas/product.schema";

export default function TestBackendPage() {
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);

  // ============================================
  // Teste 1: Listar Todos os Produtos
  // ============================================
  const handleListProducts = async () => {
    setLoading(true);
    setResult("Carregando produtos...");

    try {
      const result = await listProductsAction();

      if (result.success) {
        setProducts(result.data);
        setResult(`✅ Sucesso! ${result.data.length} produtos encontrados.`);
      } else {
        setResult(`❌ Erro: ${result.error}`);
      }
    } catch (error) {
      setResult(
        `❌ Erro inesperado: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // Teste 2: Buscar Produto por ID
  // ============================================
  const handleGetProduct = async (id: string) => {
    setLoading(true);
    setResult(`Buscando produto com ID: ${id}...`);

    try {
      const result = await getProductByIdAction(id);

      if (result.success) {
        setResult(
          `✅ Produto encontrado:\n${JSON.stringify(result.data, null, 2)}`,
        );
      } else {
        setResult(`❌ Erro: ${result.error}`);
      }
    } catch (error) {
      setResult(
        `❌ Erro inesperado: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // Teste 3: Criar Novo Produto
  // ============================================
  const handleCreateProduct = async () => {
    setLoading(true);
    setResult("Criando novo produto...");

    const newProduct: CreateProductInput = {
      title: "Camiseta de Teste",
      subtitle: "Produto criado via Server Action",
      description:
        "Este produto foi criado para testar a integração backend-frontend do Next.js com Server Actions.",
      price: 99.9,
      imageUrl:
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800",
      images: [
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800",
      ],
      category: "Teste",
      stock: 10,
      sizes: ["P", "M", "G"],
      colors: ["Branco", "Preto"],
      isActive: true,
    };

    try {
      const result = await createProductAction(newProduct);

      if (result.success) {
        setResult(
          `✅ Produto criado com sucesso!\nID: ${result.data.id}\n${JSON.stringify(result.data, null, 2)}`,
        );
        // Atualiza a lista de produtos
        await handleListProducts();
      } else {
        let errorMsg = `❌ Erro: ${result.error}`;
        if (result.details) {
          errorMsg += `\n\nDetalhes da validação:\n${result.details.map((d) => `- ${d.field}: ${d.message}`).join("\n")}`;
        }
        setResult(errorMsg);
      }
    } catch (error) {
      setResult(
        `❌ Erro inesperado: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // Teste 4: Atualizar Produto
  // ============================================
  const handleUpdateProduct = async (id: string) => {
    setLoading(true);
    setResult(`Atualizando produto ${id}...`);

    try {
      const result = await updateProductAction({
        id,
        price: 79.9, // Novo preço
        stock: 50, // Novo estoque
      });

      if (result.success) {
        setResult(
          `✅ Produto atualizado:\n${JSON.stringify(result.data, null, 2)}`,
        );
      } else {
        setResult(`❌ Erro: ${result.error}`);
      }
    } catch (error) {
      setResult(
        `❌ Erro inesperado: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // Teste 5: Validação (deve falhar)
  // ============================================
  const handleTestValidation = async () => {
    setLoading(true);
    setResult("Testando validação com dados inválidos...");

    const invalidProduct = {
      title: "AB", // Muito curto (mínimo 3)
      description: "Curto", // Muito curto (mínimo 10)
      price: -10, // Preço negativo (deve ser positivo)
      imageUrl: "url-invalida", // URL inválida
      images: [], // Array vazio (mínimo 1)
      stock: 0,
      isActive: true,
    } as unknown as CreateProductInput;

    try {
      const result = await createProductAction(invalidProduct);

      if (result.success) {
        setResult("❌ Produto não deveria ter sido criado!");
      } else {
        let errorMsg = `✅ Validação funcionou!\n\nErro: ${result.error}`;
        if (result.details) {
          errorMsg += `\n\nErros encontrados:\n${result.details.map((d) => `- ${d.field}: ${d.message}`).join("\n")}`;
        }
        setResult(errorMsg);
      }
    } catch (error) {
      setResult(
        `❌ Erro inesperado: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack gap={8} align="stretch">
        <Box>
          <Heading size="2xl" mb={2}>
            🧪 Teste de Backend com Next.js Server Actions
          </Heading>
          <Text color="gray.600">
            Esta página demonstra como o backend e frontend se comunicam sem API
            Routes.
          </Text>
        </Box>

        {/* Botões de Teste */}
        <Box borderWidth={1} borderRadius="lg" p={6}>
          <Heading size="md" mb={4}>
            🎯 Testes Disponíveis
          </Heading>

          <Stack gap={3}>
            <Button
              colorScheme="blue"
              onClick={handleListProducts}
              loading={loading}
              w="full"
            >
              1️⃣ Listar Todos os Produtos
            </Button>

            <HStack>
              <Button
                colorScheme="green"
                onClick={() => handleGetProduct("1")}
                loading={loading}
                flex={1}
              >
                2️⃣ Buscar Produto ID: 1
              </Button>
              <Button
                colorScheme="green"
                onClick={() => handleGetProduct("999")}
                loading={loading}
                flex={1}
              >
                2️⃣ Buscar ID Inexistente (999)
              </Button>
            </HStack>

            <Button
              colorScheme="purple"
              onClick={handleCreateProduct}
              loading={loading}
              w="full"
            >
              3️⃣ Criar Novo Produto
            </Button>

            <Button
              colorScheme="orange"
              onClick={() => handleUpdateProduct("1")}
              loading={loading}
              w="full"
            >
              4️⃣ Atualizar Produto ID: 1
            </Button>

            <Button
              colorScheme="red"
              onClick={handleTestValidation}
              loading={loading}
              w="full"
            >
              5️⃣ Testar Validação (Dados Inválidos)
            </Button>
          </Stack>
        </Box>

        {/* Resultado */}
        <Box borderWidth={1} borderRadius="lg" p={6} bg="gray.50">
          <Heading size="md" mb={4}>
            📊 Resultado
          </Heading>
          <Code
            display="block"
            whiteSpace="pre-wrap"
            p={4}
            borderRadius="md"
            minH="200px"
          >
            {result || "Clique em um botão para testar..."}
          </Code>
        </Box>

        {/* Lista de Produtos */}
        {products.length > 0 && (
          <Box borderWidth={1} borderRadius="lg" p={6}>
            <Heading size="md" mb={4}>
              📦 Produtos ({products.length})
            </Heading>
            <VStack gap={3} align="stretch">
              {products.map((product) => (
                <Box
                  key={product.id}
                  p={4}
                  borderWidth={1}
                  borderRadius="md"
                  bg="white"
                >
                  <Text fontWeight="bold">{product.title}</Text>
                  <Text fontSize="sm" color="gray.600">
                    {product.subtitle}
                  </Text>
                  <Text fontSize="sm" mt={2}>
                    Preço: R$ {product.price.toFixed(2)} | Estoque:{" "}
                    {product.stock}
                  </Text>
                </Box>
              ))}
            </VStack>
          </Box>
        )}

        {/* Explicação */}
        <Box borderWidth={1} borderRadius="lg" p={6} bg="blue.50">
          <Heading size="md" mb={4}>
            💡 Como Funciona?
          </Heading>
          <VStack align="start" gap={3}>
            <Text>
              <strong>1. Server Actions:</strong> Funções marcadas com "use
              server" executam no backend.
            </Text>
            <Text>
              <strong>2. Type-Safe:</strong> TypeScript garante tipos do
              frontend ao backend.
            </Text>
            <Text>
              <strong>3. Sem API Routes:</strong> Não precisa criar
              /api/products, /api/products/[id], etc.
            </Text>
            <Text>
              <strong>4. Validação Automática:</strong> Zod valida os dados
              antes de processar.
            </Text>
            <Text>
              <strong>5. Arquitetura Limpa:</strong> Use Cases, Repositories e
              Entities isolados.
            </Text>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
}
