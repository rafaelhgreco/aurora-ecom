/**
 * Cloudinary Storage Service
 *
 * Serviço para upload de arquivos no Cloudinary
 */

import { extractCloudinaryPublicId } from "@/shared/cloudinary-public-id";
import { UPLOAD_GENERIC } from "@/shared/errors/client-error-messages";

export interface UploadProgress {
  progress: number;
  bytesTransferred: number;
  totalBytes: number;
}

export interface UploadResult {
  url: string;
  fileName: string;
  publicId: string;
}

/**
 * Faz upload de um arquivo para o Cloudinary
 *
 * @param file - Arquivo a ser enviado
 * @param folder - Pasta no Cloudinary (ex: "products/images")
 * @param onProgress - Callback para acompanhar progresso
 * @returns Promise com URL do arquivo
 */
export async function uploadFile(
  file: File,
  folder: string,
  onProgress?: (progress: UploadProgress) => void,
): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append(
    "upload_preset",
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "",
  );
  formData.append("folder", folder);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        const progress = (e.loaded / e.total) * 100;
        onProgress({
          progress,
          bytesTransferred: e.loaded,
          totalBytes: e.total,
        });
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status === 200) {
        try {
          const response: unknown = JSON.parse(xhr.responseText);
          if (
            !response ||
            typeof response !== "object" ||
            typeof (response as Record<string, unknown>).secure_url !==
              "string" ||
            typeof (response as Record<string, unknown>).public_id !== "string"
          ) {
            reject(new Error(UPLOAD_GENERIC));
            return;
          }
          const parsed = response as {
            secure_url: string;
            original_filename?: string;
            public_id: string;
          };
          resolve({
            url: parsed.secure_url,
            fileName: parsed.original_filename ?? "",
            publicId: parsed.public_id,
          });
        } catch {
          reject(new Error(UPLOAD_GENERIC));
        }
      } else {
        reject(new Error(UPLOAD_GENERIC));
      }
    });

    xhr.addEventListener("error", () => {
      reject(new Error(UPLOAD_GENERIC));
    });

    xhr.addEventListener("timeout", () => {
      reject(new Error(UPLOAD_GENERIC));
    });

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    xhr.open(
      "POST",
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    );
    xhr.send(formData);
  });
}

/**
 * Erro de lote: alguns arquivos falharam no upload. Carrega os nomes dos que
 * falharam (para uma mensagem específica ao usuário) e os que tiveram sucesso
 * (caso o chamador queira reaproveitá-los em vez de reenviar tudo).
 */
export class UploadBatchError extends Error {
  constructor(
    public readonly failedFileNames: string[],
    public readonly successes: UploadResult[],
  ) {
    super(
      `Falha ao enviar ${failedFileNames.length} arquivo(s): ${failedFileNames.join(", ")}`,
    );
    this.name = "UploadBatchError";
  }
}

/**
 * Faz upload de múltiplos arquivos.
 *
 * Usa `allSettled` (em vez de `Promise.all`) para que uma falha isolada não
 * derrube o lote inteiro sem diagnóstico: em caso de falha parcial, lança
 * `UploadBatchError` nomeando os arquivos problemáticos.
 */
export async function uploadMultipleFiles(
  files: File[],
  folder: string,
  onProgress?: (fileIndex: number, progress: UploadProgress) => void,
): Promise<UploadResult[]> {
  const settled = await Promise.allSettled(
    files.map((file, index) =>
      uploadFile(file, folder, (progress) => {
        if (onProgress) {
          onProgress(index, progress);
        }
      }),
    ),
  );

  const failedFileNames = settled
    .map((result, index) =>
      result.status === "rejected" ? files[index].name : null,
    )
    .filter((name): name is string => name !== null);

  if (failedFileNames.length > 0) {
    const successes = settled
      .filter(
        (result): result is PromiseFulfilledResult<UploadResult> =>
          result.status === "fulfilled",
      )
      .map((result) => result.value);
    throw new UploadBatchError(failedFileNames, successes);
  }

  return settled.map(
    (result) => (result as PromiseFulfilledResult<UploadResult>).value,
  );
}

/**
 * Apaga imagens do Cloudinary a partir das `secure_url`s salvas no produto.
 * Chamada só depois do produto já ter sido salvo com sucesso — nunca deve
 * bloquear nem falhar o fluxo do admin; problemas aqui só vão para o console
 * (a pior consequência é a imagem ficar órfã no Cloudinary, não perda de dados).
 */
export async function deleteCloudinaryImages(urls: string[]): Promise<void> {
  const publicIds = urls
    .map((url) => extractCloudinaryPublicId(url))
    .filter((id): id is string => id !== null);

  await Promise.allSettled(
    publicIds.map(async (publicId) => {
      try {
        const res = await fetch("/api/cloudinary/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publicId }),
        });
        if (!res.ok) {
          // biome-ignore lint/suspicious/noConsole: sem serviço de log no cliente; falha aqui é silenciosa para o admin (best-effort, ver doc da função)
          console.error(
            "Falha ao apagar imagem órfã do Cloudinary",
            publicId,
            res.status,
          );
        }
      } catch (error) {
        // biome-ignore lint/suspicious/noConsole: sem serviço de log no cliente; falha aqui é silenciosa para o admin (best-effort, ver doc da função)
        console.error(
          "Falha ao apagar imagem órfã do Cloudinary",
          publicId,
          error,
        );
      }
    }),
  );
}
