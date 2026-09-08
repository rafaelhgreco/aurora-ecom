import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getRequestBaseUrl } from "@/shared/get-request-base-url";
import { ProductDetailClient } from "./product-detail-client";
import { resolveProductRoute } from "./resolve-product";

export default async function ProdutoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const resolved = await resolveProductRoute(slug);

  if (resolved.kind === "redirect") {
    redirect(`/produto/${resolved.canonicalSlug}`);
  }

  return (
    <ProductDetailClient
      product={resolved.kind === "found" ? resolved.product : null}
      slugParam={slug}
    />
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const resolved = await resolveProductRoute(slug);

  if (resolved.kind !== "found") {
    return { title: "Aurora" };
  }

  const product = resolved.product;
  const baseUrl = await getRequestBaseUrl();
  const canonicalUrl = `${baseUrl}/produto/${product.slug ?? slug}`;
  const description = product.description.slice(0, 160);

  return {
    title: `${product.title} | Aurora`,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: product.title,
      description,
      url: canonicalUrl,
      siteName: "Aurora",
      type: "website",
      locale: "pt_BR",
      images: [
        {
          url: product.imageUrl,
          width: 1200,
          height: 1200,
          alt: product.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: product.title,
      description,
      images: [product.imageUrl],
    },
  };
}
