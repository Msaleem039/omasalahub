import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductView } from "../../components/ProductView";
import { DISHES, dishDescription, dishName, dishSlug, type Dish } from "../../data/menuData";
import { API_BASE } from "../../lib/clientApi";
import type { MenuProduct } from "../../lib/types";

export const dynamic = "force-dynamic";

function asProduct(dish: Dish): MenuProduct {
  return {
    ...dish,
    slug: dishSlug(dish),
    available: dish.available !== false,
    orderable: dish.orderable !== false && dish.available !== false,
    stock: dish.stock ?? null,
    allergens: dish.allergens ?? "",
    ingredients: dish.ingredients ?? "",
    isCombo: Boolean(dish.isCombo),
    reviewAverage: dish.reviewAverage ?? null,
    reviewCount: dish.reviewCount ?? 0,
  };
}

function matchesSlug(dish: Dish, slug: string) {
  return dish.slug === slug || dish.id === slug || dishSlug(dish) === slug;
}

function fromList(products: Dish[], slug: string) {
  const product = products.find((dish) => matchesSlug(dish, slug));
  if (!product) return null;
  const related = products.filter((dish) => dish.category === product.category && dish.id !== product.id).slice(0, 3);
  return { product: asProduct(product), related: related.map(asProduct) };
}

async function loadProduct(slug: string) {
  try {
    const response = await fetch(`${API_BASE}/api/food/item/${encodeURIComponent(slug)}`, { cache: "no-store" });
    if (response.ok) {
      const data = (await response.json()) as { product?: Dish; related?: Dish[] };
      if (data.product) return { product: asProduct(data.product), related: (data.related ?? []).map(asProduct) };
    }
  } catch {
    // The item route can be down while the menu cards are still shown from the local list.
  }

  try {
    const response = await fetch(`${API_BASE}/api/food/list`, { cache: "no-store" });
    if (response.ok) {
      const data = (await response.json()) as { products?: Dish[] };
      const found = fromList(data.products ?? [], slug);
      if (found) return found;
    }
  } catch {
    // Fall through to the printed menu.
  }

  return fromList(DISHES, slug);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const loaded = await loadProduct(decodeURIComponent(slug));
  const product = loaded?.product;
  if (!product) return { title: "Plat · Masala Hub" };
  return {
    title: `${dishName(product.name, "fr")} · Masala Hub`,
    description: dishDescription(product.description, "fr"),
    alternates: { canonical: `/plat/${product.slug}` },
    openGraph: {
      title: dishName(product.name, "fr"),
      description: dishDescription(product.description, "fr"),
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
    name: dishName(product.name, "fr"),
    description: dishDescription(product.description, "fr"),
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
