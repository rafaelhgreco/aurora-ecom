const URL_PATTERN = /^https?:\/\//i;

/**
 * Converte public_id do Cloudinary ou URL completa em URL HTTPS válida.
 */
export function normalizeCloudinaryRef(
  ref: string,
  cloudName?: string,
): string | null {
  const trimmed = ref.trim();
  if (!trimmed) return null;

  if (URL_PATTERN.test(trimmed)) {
    try {
      return new URL(trimmed).href;
    } catch {
      return null;
    }
  }

  const name =
    cloudName?.trim() || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim();
  if (!name) return null;

  const publicId = trimmed.replace(/^\/+/, "");
  return `https://res.cloudinary.com/${name}/image/upload/${publicId}`;
}

/**
 * Separa lista de imagens (vírgula ou pipe) e normaliza cada referência.
 */
export function parseImageRefs(
  raw: string | undefined,
  cloudName?: string,
): { urls: string[]; invalid: string[] } {
  if (!raw?.trim()) return { urls: [], invalid: [] };

  const parts = raw
    .split(/[|,]/)
    .map((s) => s.trim())
    .filter(Boolean);

  const urls: string[] = [];
  const invalid: string[] = [];

  for (const part of parts) {
    const url = normalizeCloudinaryRef(part, cloudName);
    if (url) urls.push(url);
    else invalid.push(part);
  }

  return { urls, invalid };
}
