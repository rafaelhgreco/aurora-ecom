"use client";

import {
  Toaster as ChakraToaster,
  createToaster,
  Portal,
  Spinner,
  Stack,
  Toast,
} from "@chakra-ui/react";

export const toaster = createToaster({
  placement: "bottom-end",
  pauseOnPageIdle: true,
  // Padrão para chamadas que não passam `duration` (item 5: toast compacto,
  // sem bloquear o cadastro contínuo de produtos).
  duration: 4000,
});

export const Toaster = () => {
  return (
    <Portal>
      <ChakraToaster toaster={toaster} insetInline={{ mdDown: "4" }}>
        {(toast) => (
          <Toast.Root
            width={{ base: "calc(100vw - 2rem)", sm: "sm" }}
            maxW="sm"
            px="3"
            py="2"
          >
            {toast.type === "loading" ? (
              <Spinner size="sm" color="blue.solid" />
            ) : (
              <Toast.Indicator />
            )}
            <Stack gap="0.5" flex="1" maxWidth="100%">
              {toast.title && (
                <Toast.Title fontSize="sm">{toast.title}</Toast.Title>
              )}
              {toast.description && (
                <Toast.Description fontSize="xs">
                  {toast.description}
                </Toast.Description>
              )}
            </Stack>
            {toast.action && (
              <Toast.ActionTrigger>{toast.action.label}</Toast.ActionTrigger>
            )}
            {toast.closable && <Toast.CloseTrigger />}
          </Toast.Root>
        )}
      </ChakraToaster>
    </Portal>
  );
};
