"use client";

import { Box, Text, VStack } from "@chakra-ui/react";
import {
  BrowserMultiFormatReader,
  type IScannerControls,
} from "@zxing/browser";
import { useEffect, useRef } from "react";
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from "@/components/ui/dialog";
import { toaster } from "@/components/ui/toaster";
import { getCameraErrorMessage } from "@/shared/camera-errors";

interface CameraBarcodeScannerProps {
  open: boolean;
  onDetected: (code: string) => void;
  onClose: () => void;
}

export function CameraBarcodeScanner({
  open,
  onDetected,
  onClose,
}: CameraBarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const detectedRef = useRef(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: onClose/onDetected são recriados a cada render do componente pai; incluí-los reiniciaria a câmera sem necessidade.
  useEffect(() => {
    if (!open) return;

    detectedRef.current = false;
    const reader = new BrowserMultiFormatReader();
    let cancelled = false;

    reader
      .decodeFromVideoDevice(
        undefined,
        videoRef.current ?? undefined,
        (result, error) => {
          if (cancelled || detectedRef.current) return;

          if (result) {
            detectedRef.current = true;
            controlsRef.current?.stop();
            onDetected(result.getText());
            return;
          }

          // NotFoundException é disparada a cada frame sem código detectado —
          // não é um erro real, só "ainda não achou nada nesse frame".
          if (error && error.name !== "NotFoundException") {
            console.error(
              "[CameraBarcodeScanner] erro de decodificação:",
              error,
            );
          }
        },
      )
      .then((controls) => {
        if (cancelled) {
          controls.stop();
          return;
        }
        controlsRef.current = controls;
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("[CameraBarcodeScanner] erro ao acessar câmera:", error);
        toaster.create({
          title: "Erro na câmera",
          description: getCameraErrorMessage(error),
          type: "error",
        });
        onClose();
      });

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [open]);

  return (
    <DialogRoot
      id="camera-barcode-scanner"
      open={open}
      onOpenChange={(e) => {
        if (!e.open) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bipar com câmera</DialogTitle>
          <DialogCloseTrigger />
        </DialogHeader>

        <DialogBody>
          <VStack align="stretch" gap={4}>
            <Box
              position="relative"
              borderRadius="md"
              overflow="hidden"
              bg="black"
            >
              <video
                ref={videoRef}
                style={{ width: "100%", display: "block" }}
                muted
                playsInline
              />
              <Box
                position="absolute"
                top="50%"
                left="10%"
                right="10%"
                height="2px"
                bg="red.400"
                transform="translateY(-50%)"
                pointerEvents="none"
              />
              <Box
                position="absolute"
                top="20%"
                bottom="20%"
                left="10%"
                right="10%"
                border="2px solid"
                borderColor="whiteAlpha.700"
                borderRadius="md"
                pointerEvents="none"
              />
            </Box>
            <Text textAlign="center" color="gray.600" fontSize="sm">
              Aponte a câmera para o código de barras
            </Text>
          </VStack>
        </DialogBody>
      </DialogContent>
    </DialogRoot>
  );
}
