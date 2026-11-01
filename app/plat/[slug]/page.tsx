import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductView } from "../../components/ProductView";
import { API_BASE } from "../../lib/clientApi";
import type { MenuProduct } from "../../lib/types";

export const dynamic = "force-dynamic";

async function loadProduct(slug: string) {
  try {
    const response = await fetch(`${API_BASE}/api/food/item/${encodeURIComponent(slug)}`, { cache: "no-store" });
    if (!response.ok) return null;
    const data = (await response.json()) as { product?: MenuProduct; related?: MenuProduct[] };
    return data.product ? { product: data.product, related: data.related ?? [] } : null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const loaded = await loadProduct(decodeURIComponent(slug));
  const product = loaded?.product;
  if (!product) return { title: "Plat · Masala Hub" };
  return {
    title: `${product.name} · Masala Hub`,
    description: product.description,
    alternates: { canonical: `/plat/${product.slug}` },
    openGraph: {
      title: product.name,
      description: product.description,
      images: product.image.startsWith("data:") ? undefined : [product.image],
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const loaded = await loadProduct(decodeURIComponent(slug));
  if (!loaded) notFound();
  const { product, related } = loaded;
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.image.startsWith("data:") ? undefined : product.image,
    category: product.category,
    offers: {
      "@type": "Offer",
      priceCurrency: "EUR",
      price: product.price.toFixed(2),
      availability: product.orderable ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `/plat/${product.slug}`,
    },
  };
  if (product.reviewCount > 0 && product.reviewAverage) {
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: product.reviewAverage,
      reviewCount: product.reviewCount,
    };
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ProductView product={product} related={related} />
    </>
  );
}
