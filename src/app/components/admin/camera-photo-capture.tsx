"use client";

import { Box, Button, VStack } from "@chakra-ui/react";
import { useEffect, useRef } from "react";
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from "@/components/ui/dialog";
import { toaster } from "@/components/ui/toaster";
import { getCameraErrorMessage } from "@/shared/camera-errors";

interface CameraPhotoCaptureProps {
  open: boolean;
  onCapture: (file: File) => void;
  onClose: () => void;
}

/**
 * Captura foto via getUserMedia (não usa <input capture>) para poder validar
 * explicitamente se há câmera disponível — se não houver, avisa com toast em
 * vez de cair no fallback nativo de abrir o gerenciador de arquivos.
 */
export function CameraPhotoCapture({
  open,
  onCapture,
  onClose,
}: CameraPhotoCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: onClose é recriado a cada render do componente pai; incluí-lo reiniciaria a câmera sem necessidade.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((track) => {
            track.stop();
          });
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      })
      .catch((error) => {
        if (cancelled) return;
        toaster.create({
          title: "Câmera não disponível",
          description: getCameraErrorMessage(error),
          type: "error",
        });
        onClose();
      });

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    };
  }, [open]);

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `foto-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        onCapture(file);
      },
      "image/jpeg",
      0.9,
    );
  };

  return (
    <DialogRoot
      id="camera-photo-capture"
      open={open}
      onOpenChange={(e) => {
        if (!e.open) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tirar foto</DialogTitle>
          <DialogCloseTrigger />
        </DialogHeader>

        <DialogBody>
          <VStack align="stretch" gap={4}>
            <Box borderRadius="md" overflow="hidden" bg="black">
              <video
                ref={videoRef}
                muted
                playsInline
                style={{ width: "100%", display: "block" }}
              />
            </Box>
          </VStack>
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button colorScheme="blue" onClick={handleCapture}>
            Capturar
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
}
