import { Box, Button, Container, Text, VStack } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { IoAlertCircleOutline, IoArrowBack, IoRefresh } from "react-icons/io5";
import styles from "@/app/page.module.css";

interface ErrorStateProps {
  message: string;

  title?: string;

  onRetry?: () => void;

  retryText?: string;

  backUrl?: string;

  backText?: string;

  fullPage?: boolean;

  maxWidth?: string;

  showIcon?: boolean;
}

export function ErrorState({
  message,
  title = "Ops! Algo deu errado",
  onRetry,
  retryText = "Tentar novamente",
  backUrl,
  backText = "Voltar",
  fullPage = true,
  maxWidth = "container.xl",
  showIcon = true,
}: ErrorStateProps) {
  const router = useRouter();

  const handleBack = () => {
    if (backUrl) {
      router.push(backUrl);
    } else {
      router.back();
    }
  };

  const content = (
    <Container maxW={maxWidth} py={8}>
      <Box textAlign="center" py={10}>
        <VStack gap={4}>
          {showIcon && (
            <IoAlertCircleOutline
              size={64}
              style={{ color: "var(--chakra-colors-red-500)" }}
            />
          )}

          <Text fontSize="2xl" fontWeight="bold" color="gray.800">
            {title}
          </Text>

          <Text color="red.500" fontSize="lg" maxW="500px">
            {message}
          </Text>

          <Box display="flex" gap={3} mt={4}>
            {onRetry && (
              <Button colorScheme="blue" onClick={onRetry}>
                <IoRefresh style={{ marginRight: "8px" }} />
                {retryText}
              </Button>
            )}

            <Button
              variant={onRetry ? "outline" : "solid"}
              colorScheme={onRetry ? "gray" : "blue"}
              onClick={handleBack}
            >
              <IoArrowBack style={{ marginRight: "8px" }} />
              {backText}
            </Button>
          </Box>
        </VStack>
      </Box>
    </Container>
  );

  if (!fullPage) {
    return content;
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>{content}</main>
    </div>
  );
}
