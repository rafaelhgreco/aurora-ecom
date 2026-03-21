"use client";

import {
  Box,
  Button,
  Card,
  Container,
  Heading,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { loginAction } from "@/app/actions/auth";
import { Field } from "@/components/ui/field";
import { toaster } from "@/components/ui/toaster";

export default function LoginPage() {
  const [isPending, startTransition] = useTransition();
  const [formKey, setFormKey] = useState(0);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const result = await loginAction(formData);

      if (result?.error) {
        toaster.create({
          title: "Não foi possível entrar",
          description: result.error,
          type: "error",
          duration: 6000,
          closable: true,
        });
        setFormKey((k) => k + 1);
      }
    });
  };

  return (
    <Box minH="100vh" bg="gray.50" py={{ base: 10, md: 16 }} px={4}>
      <Container maxW="md">
        <Card.Root shadow="md" borderRadius="lg">
          <Card.Body p={{ base: 6, md: 10 }}>
            <Stack gap={8} align="stretch">
              <Box textAlign="center">
                <Heading size="xl" fontWeight="semibold" letterSpacing="tight">
                  Acesso administrativo
                </Heading>
                <Text color="gray.600" mt={2} fontSize="sm">
                  Entre com email e senha para gerenciar produtos.
                </Text>
              </Box>

              <form key={formKey} onSubmit={handleSubmit}>
                <Stack gap={5}>
                  <Field label="Email" required>
                    <Input
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="seu@email.com"
                      required
                      size="lg"
                    />
                  </Field>

                  <Field label="Senha" required>
                    <Input
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      placeholder="••••••••"
                      required
                      minLength={3}
                      size="lg"
                    />
                  </Field>

                  <Button
                    type="submit"
                    colorScheme="blue"
                    size="lg"
                    width="full"
                    loading={isPending}
                    loadingText="Entrando..."
                  >
                    Entrar
                  </Button>
                </Stack>
              </form>

              <Text fontSize="sm" color="gray.500" textAlign="center">
                Problemas com acesso?{" "}
                <Text as="span" fontWeight="medium">
                  Contate o suporte.
                </Text>
              </Text>

              <Box textAlign="center">
                <Link href="/">
                  <Text
                    fontSize="sm"
                    color="blue.600"
                    _hover={{ textDecoration: "underline" }}
                  >
                    Voltar à loja
                  </Text>
                </Link>
              </Box>
            </Stack>
          </Card.Body>
        </Card.Root>
      </Container>
    </Box>
  );
}
