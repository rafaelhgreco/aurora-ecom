/**
 * Página: Novo Produto
 *
 * Página de cadastro de novo produto com upload de imagens
 * Integrado com Firestore Database e Firebase Storage
 */

"use client";

import {
  Box,
  Button,
  Card,
  Container,
  Grid,
  Heading,
  HStack,
  IconButton,
  Image,
  Input,
  Spinner,
  Stack,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";
import { IoArrowBack, IoClose, IoCloudUpload } from "react-icons/io5";
import { z } from "zod";
import { useProductCRUD } from "@/app/hooks/use-product-crud";
import type { CreateProductData } from "@/app/types/product";
import { Alert } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { ProgressBar, ProgressRoot } from "@/components/ui/progress";
import { toaster } from "@/components/ui/toaster";
import { uploadMultipleFiles } from "@/infrastructure/lib/cloudinary.service";

const SIZES = ["PP", "P", "M", "G", "GG", "XG"] as const;

const formSchema = z.object({
  title: z
    .string()
    .min(3, "Título deve ter no mínimo 3 caracteres")
    .max(100, "Título deve ter no máximo 100 caracteres"),
  subtitle: z.string().optional(),
  description: z
    .string()
    .min(10, "Descrição deve ter no mínimo 10 caracteres")
    .max(5000, "Descrição deve ter no máximo 5000 caracteres"),
  price: z
    .number()
    .positive("Preço deve ser maior que zero")
    .multipleOf(0.01, "Preço deve ter no máximo 2 casas decimais"),
  category: z.string().optional(),
  stock: z.number().int().nonnegative().default(0),
  sizes: z.array(z.enum(["PP", "P", "M", "G", "GG", "XG"])).optional(),
  colors: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      if (typeof val === "string") {
        return val
          .split(",")
          .map((c) => c.trim())
          .filter((c) => c.length > 0);
      }
      return val;
    }),
  isActive: z.boolean().default(true),
});

type FormInput = z.infer<typeof formSchema>;

export default function NovoProductPage() {
  const router = useRouter();
  const { createProduct } = useProductCRUD();

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<number, number>>(
    {},
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<FormInput>({
    // biome-ignore lint/suspicious/noExplicitAny: zodResolver type compatibility
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      title: "",
      description: "",
      price: 0,
      stock: 0,
      isActive: true,
    },
  });

  const selectedSizes = watch("sizes") || [];
  const isActive = watch("isActive") ?? true;

  /**
   * Adiciona imagens selecionadas
   */
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (files.length === 0) return;

    const remainingSlots = 10 - imageFiles.length;
    const filesToAdd = files.slice(0, remainingSlots);

    const newPreviews = filesToAdd.map((file) => URL.createObjectURL(file));

    setImageFiles([...imageFiles, ...filesToAdd]);
    setImagePreviews([...imagePreviews, ...newPreviews]);
  };

  /**
   * Remove imagem
   */
  const handleRemoveImage = (index: number) => {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);

    URL.revokeObjectURL(imagePreviews[index]);

    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
  };

  /**
   * Faz upload das imagens
   */
  const handleUploadImages = async (): Promise<string[]> => {
    if (imageFiles.length === 0) {
      throw new Error("Selecione pelo menos uma imagem");
    }

    setIsUploading(true);
    setUploadProgress({});

    try {
      const results = await uploadMultipleFiles(
        imageFiles,
        "products/images",
        (fileIndex, progress) => {
          setUploadProgress((prev) => ({
            ...prev,
            [fileIndex]: progress.progress,
          }));
        },
      );

      const urls = results.map((r) => r.url);
      return urls;
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Toggle size selection
   */
  const handleToggleSize = (size: string) => {
    const current = selectedSizes || [];
    const newSizes = current.includes(size as (typeof SIZES)[number])
      ? current.filter((s) => s !== size)
      : [...current, size as (typeof SIZES)[number]];
    setValue("sizes", newSizes as (typeof SIZES)[number][]);
  };

  /**
   * Submit do formulário
   */
  const onSubmit: SubmitHandler<FormInput> = async (data) => {
    try {
      setIsSubmitting(true);
      setSubmitStatus(null);

      const imageUrls = await handleUploadImages();

      const productData: CreateProductData = {
        title: data.title,
        subtitle: data.subtitle,
        description: data.description,
        price: data.price,
        imageUrl: imageUrls[0],
        images: imageUrls,
        category: data.category,
        stock: data.stock ?? 0,
        sizes: data.sizes,
        colors: data.colors as string[] | undefined,
        isActive: data.isActive ?? true,
      };

      const result = await createProduct(productData);

      if (result.success) {
        toaster.create({
          title: "✅ Produto Cadastrado!",
          description: `${productData.title} foi adicionado ao Firestore com sucesso!`,
          type: "success",
          duration: 5000,
        });

        setSubmitStatus({
          type: "success",
          message: "Produto cadastrado com sucesso! Redirecionando...",
        });

        reset();
        setImageFiles([]);
        setImagePreviews([]);

        setTimeout(() => {
          router.push("/admin-produtos");
        }, 2000);
      } else {
        toaster.create({
          title: "❌ Erro ao Cadastrar",
          description: result.error || "Erro ao cadastrar produto",
          type: "error",
          duration: 5000,
        });

        setSubmitStatus({
          type: "error",
          message: result.error || "Erro ao cadastrar produto",
        });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro desconhecido";
      setSubmitStatus({
        type: "error",
        message,
      });
      toaster.create({
        title: "Erro",
        description: message,
        type: "error",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxW="container.xl" py={8}>
      {/* Header com botão de voltar */}
      <HStack mb={6} justify="space-between">
        <Box>
          <Heading size="2xl">Novo Produto</Heading>
          <Text color="gray.600" mt={2}>
            Cadastre um novo produto no Firestore com imagens no Storage
          </Text>
        </Box>
        <Button
          onClick={() => router.push("/admin-produtos")}
          variant="outline"
        >
          <IoArrowBack />
          Voltar
        </Button>
      </HStack>

      {/* Status Message */}
      {submitStatus && (
        <Alert
          status={submitStatus.type}
          title={submitStatus.type === "success" ? "Sucesso!" : "Erro"}
        >
          {submitStatus.message}
        </Alert>
      )}

      {/* Alerta de imagens obrigatórias */}
      {imageFiles.length === 0 && (
        <Alert status="info" title="Atenção">
          Você precisa selecionar pelo menos uma imagem para cadastrar o
          produto.
        </Alert>
      )}

      {/* Formulário */}
      <form
        onSubmit={handleSubmit(
          // biome-ignore lint/suspicious/noExplicitAny: handleSubmit type compatibility
          onSubmit as any,
          () => {
            toaster.create({
              title: "Erro de Validação",
              description: "Preencha todos os campos obrigatórios corretamente",
              type: "error",
              duration: 5000,
            });
          },
        )}
      >
        <VStack gap={6} align="stretch">
          {/* === SEÇÃO DE UPLOAD === */}
          <Card.Root>
            <Card.Header>
              <Heading size="lg">Imagens do Produto</Heading>
              <Text color="gray.600" fontSize="sm">
                Selecione até 10 imagens (a primeira será a principal)
              </Text>
            </Card.Header>
            <Card.Body>
              <VStack gap={4} align="stretch">
                {/* Botão de Seleção */}
                <Box>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    display="none"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload">
                    <Button
                      as="span"
                      colorScheme="blue"
                      variant="outline"
                      width="full"
                      cursor="pointer"
                      disabled={imageFiles.length >= 10 || isUploading}
                    >
                      <IoCloudUpload />
                      Selecionar Imagens ({imageFiles.length}/10)
                    </Button>
                  </label>
                </Box>

                {/* Previews */}
                {imagePreviews.length > 0 && (
                  <Grid
                    templateColumns="repeat(auto-fill, minmax(150px, 1fr))"
                    gap={4}
                  >
                    {imagePreviews.map((preview, index) => (
                      <Box
                        key={preview}
                        position="relative"
                        borderRadius="md"
                        overflow="hidden"
                        border="1px solid"
                        borderColor="gray.200"
                      >
                        <Image
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          height="150px"
                          width="full"
                          objectFit="cover"
                        />
                        <IconButton
                          aria-label="Remover imagem"
                          position="absolute"
                          top={2}
                          right={2}
                          size="sm"
                          colorScheme="red"
                          onClick={() => handleRemoveImage(index)}
                        >
                          <IoClose />
                        </IconButton>
                        {index === 0 && (
                          <Box
                            position="absolute"
                            bottom={0}
                            left={0}
                            right={0}
                            bg="blue.500"
                            color="white"
                            fontSize="xs"
                            textAlign="center"
                            py={1}
                          >
                            Imagem Principal
                          </Box>
                        )}
                      </Box>
                    ))}
                  </Grid>
                )}

                {/* Progress */}
                {isUploading && (
                  <VStack gap={2}>
                    {Object.entries(uploadProgress).map(([index, progress]) => (
                      <Box key={`progress-${index}`} width="full">
                        <HStack justify="space-between" mb={1}>
                          <Text fontSize="sm">Imagem {Number(index) + 1}</Text>
                          <Text fontSize="sm">{Math.round(progress)}%</Text>
                        </HStack>
                        <ProgressRoot value={progress}>
                          <ProgressBar />
                        </ProgressRoot>
                      </Box>
                    ))}
                  </VStack>
                )}
              </VStack>
            </Card.Body>
          </Card.Root>

          {/* === INFORMAÇÕES BÁSICAS === */}
          <Card.Root>
            <Card.Header>
              <Heading size="lg">Informações Básicas</Heading>
            </Card.Header>
            <Card.Body>
              <Stack gap={4}>
                <Field
                  label="Título"
                  required
                  invalid={!!errors.title}
                  errorText={errors.title?.message}
                >
                  <Input {...register("title")} placeholder="Nome do produto" />
                </Field>

                <Field
                  label="Subtítulo"
                  invalid={!!errors.subtitle}
                  errorText={errors.subtitle?.message}
                >
                  <Input
                    {...register("subtitle")}
                    placeholder="Descrição curta"
                  />
                </Field>

                <Field
                  label="Descrição"
                  required
                  invalid={!!errors.description}
                  errorText={errors.description?.message}
                >
                  <Textarea
                    {...register("description")}
                    placeholder="Descrição detalhada do produto"
                    rows={4}
                  />
                </Field>

                <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
                  <Field
                    label="Preço (R$)"
                    required
                    invalid={!!errors.price}
                    errorText={errors.price?.message}
                  >
                    <Input
                      {...register("price", { valueAsNumber: true })}
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                    />
                  </Field>

                  <Field
                    label="Estoque"
                    required
                    invalid={!!errors.stock}
                    errorText={errors.stock?.message}
                  >
                    <Input
                      {...register("stock", { valueAsNumber: true })}
                      type="number"
                      placeholder="0"
                    />
                  </Field>
                </Grid>

                <Field
                  label="Categoria"
                  invalid={!!errors.category}
                  errorText={errors.category?.message}
                >
                  <Input
                    {...register("category")}
                    placeholder="Ex: Roupas, Acessórios"
                  />
                </Field>
              </Stack>
            </Card.Body>
          </Card.Root>

          {/* === VARIAÇÕES === */}
          <Card.Root>
            <Card.Header>
              <Heading size="lg">Variações</Heading>
            </Card.Header>
            <Card.Body>
              <Stack gap={4}>
                <Box>
                  <Text fontWeight="medium" mb={2}>
                    Tamanhos Disponíveis
                  </Text>
                  <Grid
                    templateColumns="repeat(auto-fill, minmax(80px, 1fr))"
                    gap={2}
                  >
                    {SIZES.map((size) => (
                      <Checkbox
                        key={size}
                        checked={selectedSizes.includes(size)}
                        onCheckedChange={() => handleToggleSize(size)}
                      >
                        {size}
                      </Checkbox>
                    ))}
                  </Grid>
                </Box>

                <Field
                  label="Cores Disponíveis"
                  invalid={!!errors.colors}
                  errorText={errors.colors?.message}
                >
                  <Input
                    {...register("colors")}
                    placeholder="Ex: Preto, Branco, Azul (separado por vírgula)"
                  />
                </Field>
              </Stack>
            </Card.Body>
          </Card.Root>

          {/* === STATUS === */}
          <Card.Root>
            <Card.Header>
              <Heading size="lg">Status</Heading>
            </Card.Header>
            <Card.Body>
              <Checkbox
                checked={isActive}
                onCheckedChange={(e) => {
                  const value = e.checked === true;
                  setValue("isActive", value);
                }}
              >
                Produto Ativo (visível na loja)
              </Checkbox>
            </Card.Body>
          </Card.Root>

          {/* === BOTÕES === */}
          <HStack justify="flex-end" gap={3}>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin-produtos")}
              disabled={isSubmitting || isUploading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              colorScheme="blue"
              disabled={isSubmitting || isUploading || imageFiles.length === 0}
              onClick={(e) => {
                if (imageFiles.length === 0) {
                  e.preventDefault();
                  toaster.create({
                    title: "Atenção",
                    description:
                      "Selecione pelo menos uma imagem antes de cadastrar",
                    type: "warning",
                    duration: 3000,
                  });
                }
              }}
            >
              {(isUploading || isSubmitting) && <Spinner size="sm" mr={2} />}
              {isUploading
                ? "Fazendo Upload..."
                : isSubmitting
                  ? "Cadastrando..."
                  : imageFiles.length === 0
                    ? "Selecione ao menos uma imagem"
                    : "Cadastrar Produto"}
            </Button>
          </HStack>
        </VStack>
      </form>
    </Container>
  );
}
