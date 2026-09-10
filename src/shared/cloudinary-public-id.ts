/**
 * Extrai o `public_id` do Cloudinary a partir de uma `secure_url` (a única
 * coisa que o produto guarda hoje — o upload no formulário descarta o
 * `publicId` retornado pelo Cloudinary). Formato típico:
 *
 *   https://res.cloudinary.com/<cloud>/image/upload/v1699999999/products/images/abc123.jpg
 *
 * `public_id` é tudo entre `/upload/` e a extensão, descartando o segmento de
 * versão (`vNNN`) e uma eventual string de transformação antes dele.
 * Retorna `null` quando a URL não segue o padrão do Cloudinary (ex.: o
 * placeholder local de rascunho) — nesse caso não há nada para apagar.
 */
export function extractCloudinaryPublicId(secureUrl: string): string | null {
  const match = secureUrl.match(/\/upload\/(.+)$/);
  if (!match) return null;

  const segments = match[1].split("/").filter(Boolean);
  if (segments.length === 0) return null;

  // String de transformação (ex.: "c_fill,w_200") sempre tem vírgula.
  if (segments[0].includes(",")) {
    segments.shift();
  }
  // Segmento de versão (ex.: "v1699999999").
  if (segments[0] && /^v\d+$/.test(segments[0])) {
    segments.shift();
  }

  if (segments.length === 0) return null;

  const path = segments.join("/").replace(/\.[a-zA-Z0-9]+$/, "");
  return path || null;
}
