import { Box, Button, Container, Text, VStack } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { IoAddCircleOutline, IoSearchOutline } from "react-icons/io5";
import styles from "@/app/page.module.css";

interface EmptyStateProps {
  title: string;

  description: string;

  icon?: React.ReactNode;

  actionText?: string;

  onAction?: () => void;

  actionUrl?: string;

  fullPage?: boolean;

  maxWidth?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  actionText,
  onAction,
  actionUrl,
  fullPage = true,
  maxWidth = "container.xl",
}: EmptyStateProps) {
  const router = useRouter();

  const handleAction = () => {
    if (onAction) {
      onAction();
    } else if (actionUrl) {
      router.push(actionUrl);
    }
  };

  const defaultIcon = icon || (
    <IoSearchOutline
      size={64}
      style={{ color: "var(--chakra-colors-gray-400)" }}
    />
  );

  const content = (
    <Container maxW={maxWidth} py={8}>
      <Box textAlign="center" py={10}>
        <VStack gap={4}>
          {defaultIcon}

          <Text fontSize="2xl" fontWeight="bold" color="gray.700">
            {title}
          </Text>

          <Text color="gray.500" fontSize="md" maxW="500px">
            {description}
          </Text>

          {(actionText || actionUrl) && (
            <Button colorScheme="blue" onClick={handleAction} mt={4}>
              <IoAddCircleOutline style={{ marginRight: "8px" }} />
              {actionText || "Começar"}
            </Button>
          )}
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
