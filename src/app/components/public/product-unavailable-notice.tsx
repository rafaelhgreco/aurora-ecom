import type { ButtonProps } from "@chakra-ui/react";
import { Box, Text, VStack } from "@chakra-ui/react";
import { FiInfo } from "react-icons/fi";
import { WhatsAppProductInquiryButton } from "./whatsapp-checkout-button";

interface ProductUnavailableNoticeProps {
  productSlug: string;
  productTitle: string;
  /** Estilo alinhado aos outros CTAs da página (ex.: PRODUCT_CTA_LAYOUT) */
  ctaLayout?: Partial<ButtonProps>;
}

/**
 * Estado único para produto pausado ou sem estoque: mensagem amigável +
 * um único CTA levando ao WhatsApp para tirar dúvidas, sem opções de compra.
 */
export const ProductUnavailableNotice = ({
  productSlug,
  productTitle,
  ctaLayout,
}: ProductUnavailableNoticeProps) => {
  return (
    <Box
      w="full"
      p="4"
      bg="gray.50"
      borderRadius="md"
      borderWidth="1px"
      borderColor="gray.200"
    >
      <VStack align="start" gap="3">
        <Box display="flex" alignItems="center" gap="2">
          <FiInfo size={18} color="var(--chakra-colors-gray-600)" />
          <Text fontSize="sm" fontWeight="semibold" color="gray.800">
            Produto indisponível no momento
          </Text>
        </Box>
        <Text fontSize="sm" color="gray.600">
          Fale com a gente pelo WhatsApp para saber mais ou ser avisado quando
          ele estiver disponível novamente.
        </Text>
        <Box w="full">
          <WhatsAppProductInquiryButton
            productSlug={productSlug}
            productTitle={productTitle}
            unavailable
            buttonProps={{
              ...ctaLayout,
              _hover: {
                transform: "translateY(-2px)",
                shadow: "md",
                bg: "#20BD5A",
              },
              _active: { transform: "translateY(0)" },
            }}
          />
        </Box>
      </VStack>
    </Box>
  );
};
