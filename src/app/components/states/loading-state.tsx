import { Box, Container, Spinner, type SpinnerProps } from "@chakra-ui/react";
import styles from "@/app/page.module.css";

interface LoadingStateProps {
  size?: SpinnerProps["size"];

  minHeight?: string;

  fullPage?: boolean;

  maxWidth?: string;
}

export function LoadingState({
  size = "xl",
  minHeight = "400px",
  fullPage = true,
  maxWidth = "container.xl",
}: LoadingStateProps) {
  const content = (
    <Container maxW={maxWidth} py={8}>
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minH={minHeight}
      >
        <Spinner size={size} />
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
