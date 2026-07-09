/**
 * Cloudinary Storage Service
 *
 * Serviço para upload de arquivos no Cloudinary
 */

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
          const response = JSON.parse(xhr.responseText);
          resolve({
            url: response.secure_url,
            fileName: response.original_filename,
            publicId: response.public_id,
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
 * Faz upload de múltiplos arquivos
 */
export async function uploadMultipleFiles(
  files: File[],
  folder: string,
  onProgress?: (fileIndex: number, progress: UploadProgress) => void,
): Promise<UploadResult[]> {
  const uploadPromises = files.map((file, index) =>
    uploadFile(file, folder, (progress) => {
      if (onProgress) {
        onProgress(index, progress);
      }
    }),
  );

  return Promise.all(uploadPromises);
}

/**
 * Deleta uma imagem do Cloudinary
 */
export async function deleteFile(publicId: string): Promise<void> {
  try {
    const response = await fetch("/api/cloudinary/delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ publicId }),
    });

    if (!response.ok) {
      throw new Error("Erro ao deletar arquivo");
    }
  } catch (error) {
    console.error("Erro ao deletar arquivo do Cloudinary:", error);
    throw new Error("Erro ao deletar arquivo");
  }
}
