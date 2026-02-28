/**
 * Firebase Storage Service
 *
 * Serviço para upload de arquivos no Firebase Storage
 */

import {
  getDownloadURL,
  ref,
  type UploadTaskSnapshot,
  uploadBytesResumable,
} from "firebase/storage";
import { storage } from "@/infrastructure/lib/firebase";

export interface UploadProgress {
  progress: number;
  bytesTransferred: number;
  totalBytes: number;
}

export interface UploadResult {
  url: string;
  fileName: string;
  fullPath: string;
}

/**
 * Faz upload de um arquivo para o Firebase Storage
 *
 * @param file - Arquivo a ser enviado
 * @param path - Caminho no Storage (ex: "products/images")
 * @param onProgress - Callback para acompanhar progresso
 * @returns Promise com URL do arquivo
 */
export async function uploadFile(
  file: File,
  path: string,
  onProgress?: (progress: UploadProgress) => void,
): Promise<UploadResult> {
  const timestamp = Date.now();
  const fileName = `${timestamp}-${file.name}`;
  const fullPath = `${path}/${fileName}`;

  const storageRef = ref(storage, fullPath);

  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snapshot: UploadTaskSnapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;

        if (onProgress) {
          onProgress({
            progress,
            bytesTransferred: snapshot.bytesTransferred,
            totalBytes: snapshot.totalBytes,
          });
        }
      },
      (error) => {
        console.error("Erro no upload:", error);
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({
            url: downloadURL,
            fileName,
            fullPath,
          });
        } catch (error) {
          reject(error);
        }
      },
    );
  });
}

/**
 * Faz upload de múltiplos arquivos
 */
export async function uploadMultipleFiles(
  files: File[],
  path: string,
  onProgress?: (fileIndex: number, progress: UploadProgress) => void,
): Promise<UploadResult[]> {
  const uploadPromises = files.map((file, index) =>
    uploadFile(file, path, (progress) => {
      if (onProgress) {
        onProgress(index, progress);
      }
    }),
  );

  return Promise.all(uploadPromises);
}
