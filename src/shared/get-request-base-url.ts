import { headers } from "next/headers";

/**
 * URL base absoluta do request atual (para `metadataBase`/OG image em
 * `generateMetadata`). Deriva do host do próprio request — não exige nenhuma
 * env var — com `NEXT_PUBLIC_SITE_URL` como override opcional.
 */
export async function getRequestBaseUrl(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");

  return `${proto}://${host}`;
}
