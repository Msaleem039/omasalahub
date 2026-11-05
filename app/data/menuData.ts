export type MenuCategory =
  | "specialites"
  | "biryanis"
  | "naans"
  | "pizzas"
  | "entrees"
  | "formules"
  | "boissons";

export interface DishVariant {
  id: string;
  group: string;
  name: string;
  priceDelta: number;
  available: boolean;
}

export interface DishExtra {
  id: string;
  name: string;
  price: number;
  available: boolean;
}

export interface Dish {
  id: string;
  name: string;
  category: MenuCategory;
  price: number;
  /** Legacy catalog field. Customer ratings come from verified reviews, not this value. */
  rating?: number;
  image: string;
  description: string;
  slug?: string;
  available?: boolean;
  orderable?: boolean;
  stock?: number | null;
  allergens?: string;
  ingredients?: string;
  isCombo?: boolean;
  variants?: DishVariant[];
  extras?: DishExtra[];
  reviewAverage?: number | null;
  reviewCount?: number;
  relatedIds?: string[];
}

export const CATEGORIES: { slug: MenuCategory | "all"; label: string }[] = [
  { slug: "all", label: "All" },
  { slug: "specialites", label: "Spécialités" },
  { slug: "biryanis", label: "Biryanis" },
  { slug: "naans", label: "Naans" },
  { slug: "pizzas", label: "Pizzas" },
  { slug: "entrees", label: "Entrées" },
  { slug: "formules", label: "Formules" },
  { slug: "boissons", label: "Lassis & drinks" },
];

const img = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=80`;

export const DISHES: Dish[] = [
  {
    id: "sp-1",
    name: "Butter Chicken",
    category: "specialites",
    price: 12.9,
    rating: 4.9,
    image: img("photo-1603894584373-5ac82b2ae398"),
    description: "Creamy tomato butter chicken, served with basmati rice.",
  },
  {
    id: "sp-2",
    name: "Chicken Masala",
    category: "specialites",
    price: 12.9,
    rating: 4.8,
    image: img("photo-1585937421612-70a008356fbe"),
    description: "Slow-cooked chicken in a spiced masala gravy, served with basmati rice.",
  },
  {
    id: "sp-3",
    name: "Chicken Tikka Masala",
    category: "specialites",
    price: 12.9,
    rating: 4.9,
    image: img("photo-1565557623262-b51c2513a641"),
    description: "Grilled chicken tikka folded into a warm masala sauce, with basmati rice.",
  },
  {
    id: "sp-4",
    name: "Chicken Balti",
    category: "specialites",
    price: 12.9,
    rating: 4.7,
    image: img("photo-1574484284002-952d92456975"),
    description: "Chicken balti in a rich pepper sauce, served with basmati rice.",
  },
  {
    id: "sp-5",
    name: "Poulet Shahi Korma",
    category: "specialites",
    price: 13.9,
    rating: 4.8,
    image: img("photo-1545247181-516773cae754"),
    description: "Mild shahi korma with cream and warm spices, served with basmati rice.",
  },
  {
    id: "sp-6",
    name: "Dal Tadka",
    category: "specialites",
    price: 10.9,
    rating: 4.6,
    image: img("photo-1546833999-b9f581a1996d"),
    description: "Tempered yellow lentils finished with ghee and cumin, served with basmati rice.",
  },
  {
    id: "by-1",
    name: "Biryani Poulet",
    category: "biryanis",
    price: 12.9,
    rating: 4.9,
    image: "/image/buryani.jpg",
    description: "Chicken biryani layered with saffron basmati rice and fried onions.",
  },
  {
    id: "by-2",
    name: "Biryani Végétarien",
    category: "biryanis",
    price: 10.9,
    rating: 4.7,
    image: img("photo-1589302168068-964664d93dc0"),
    description: "Vegetable biryani with garden vegetables and fragrant basmati rice.",
  },
  {
    id: "na-1",
    name: "Naan Poulet",
    category: "naans",
    price: 8.9,
    rating: 4.7,
    image: img("photo-1610194352361-4c81a6a8967e"),
    description: "Tandoor naan filled with seasoned chicken.",
  },
  {
    id: "na-2",
    name: "Naan Chicken Masala",
    category: "naans",
    price: 9.5,
    rating: 4.8,
    image: img("photo-1599487488170-d11ec9c172f0"),
    description: "Stuffed naan with chicken masala and fresh herbs.",
  },
  {
    id: "na-3",
    name: "Cheese Naan",
    category: "naans",
    price: 3.5,
    rating: 4.8,
    image: img("photo-1601050690597-df0568f70950"),
    description: "Soft tandoor naan stuffed with melted cheese.",
  },
  {
    id: "pz-1",
    name: "Pizza Chicken",
    category: "pizzas",
    price: 10,
    rating: 4.7,
    image: img("photo-1565299624946-b28f40a0ae38"),
    description: "Chicken pizza with house-made sauce.",
  },
  {
    id: "pz-2",
    name: "Pizza Butter Chicken",
    category: "pizzas",
    price: 10,
    rating: 4.8,
    image: img("photo-1513104890138-7c749659a591"),
    description: "Butter chicken pizza with house-made sauce.",
  },
  {
    id: "en-1",
    name: "Samosa (2 pièces)",
    category: "entrees",
    price: 3.9,
    rating: 4.8,
    image: img("photo-1606491956689-2ea866880c84"),
    description: "Two crisp pastry samosas with a spiced filling.",
  },
  {
    id: "en-2",
    name: "Pakora Légumes (4 pièces)",
    category: "entrees",
    price: 4.5,
    rating: 4.6,
    image: img("photo-1626132647523-66f5bf380027"),
    description: "Four vegetable pakoras, fried until golden.",
  },
  {
    id: "fo-1",
    name: "Menu Butter Chicken",
    category: "formules",
    price: 14.5,
    rating: 4.9,
    image: img("photo-1505253758473-96b7015fcd40"),
    description: "Poulet + riz + boisson 33 cl.",
  },
  {
    id: "fo-2",
    name: "Menu Pizza",
    category: "formules",
    price: 12,
    rating: 4.7,
    image: img("photo-1574071318508-1cdbab80d002"),
    description: "Pizza au choix + boisson 33 cl.",
  },
  {
    id: "fo-3",
    name: "Menu Naan",
    category: "formules",
    price: 12.5,
    rating: 4.7,
    image: img("photo-1631452180519-c014fe946bc7"),
    description: "Naan garni + boisson 33 cl.",
  },
  {
    id: "bo-1",
    name: "Lassi Mangue",
    category: "boissons",
    price: 3.9,
    rating: 4.8,
    image: img("photo-1623065422902-30a2d299bbe4"),
    description: "Chilled mango lassi, blended thick and smooth.",
  },
  {
    id: "bo-2",
    name: "Lassi Rose",
    category: "boissons",
    price: 3.9,
    rating: 4.7,
    image: img("photo-1556679343-c7306c1976bc"),
    description: "Rose lassi with a light floral finish.",
  },
  {
    id: "bo-3",
    name: "Lassi Nature",
    category: "boissons",
    price: 3.5,
    rating: 4.6,
    image: img("photo-1563636619-e9143da7973b"),
    description: "Plain yogurt lassi, lightly salted and refreshing.",
  },
  {
    id: "bo-4",
    name: "Boisson 33 cl",
    category: "boissons",
    price: 2,
    rating: 4.5,
    image: img("photo-1554866585-cd94860890b7"),
    description: "Chilled soft drink, 33 cl.",
  },
];

export const MENU_ITEMS = DISHES;
export const ALL_MENU_DISHES = DISHES;

const CATEGORY_TEXT: Record<string, { en: string; fr: string }> = {
  all: { en: "All", fr: "Tout" },
  specialites: { en: "Specialties", fr: "Spécialités" },
  biryanis: { en: "Biryanis", fr: "Biryanis" },
  naans: { en: "Naans", fr: "Naans" },
  pizzas: { en: "Pizzas", fr: "Pizzas" },
  entrees: { en: "Starters", fr: "Entrées" },
  formules: { en: "Set menus", fr: "Formules" },
  boissons: { en: "Lassis & drinks", fr: "Lassis et boissons" },
};

export function categoryLabel(slug: string, lang: "en" | "fr" = "fr") {
  return CATEGORY_TEXT[slug]?.[lang] ?? CATEGORIES.find((category) => category.slug === slug)?.label ?? slug.replace(/-/g, " ");
}

const DESCRIPTION_PAIRS: [string, string][] = [
  ["Creamy tomato butter chicken, served with basmati rice.", "Poulet au beurre, sauce tomate crémeuse, servi avec du riz basmati."],
  ["Slow-cooked chicken in a spiced masala gravy, served with basmati rice.", "Poulet mijoté dans une sauce masala épicée, servi avec du riz basmati."],
  ["Grilled chicken tikka folded into a warm masala sauce, with basmati rice.", "Poulet tikka grillé dans une sauce masala, avec du riz basmati."],
  ["Chicken balti in a rich pepper sauce, served with basmati rice.", "Poulet balti dans une sauce poivrée, servi avec du riz basmati."],
  ["Mild shahi korma with cream and warm spices, served with basmati rice.", "Shahi korma doux à la crème et aux épices, servi avec du riz basmati."],
  ["Tempered yellow lentils finished with ghee and cumin, served with basmati rice.", "Lentilles jaunes au ghee et au cumin, servies avec du riz basmati."],
  ["Chicken biryani layered with saffron basmati rice and fried onions.", "Biryani de poulet au riz basmati safrané et aux oignons frits."],
  ["Vegetable biryani with garden vegetables and fragrant basmati rice.", "Biryani de légumes au riz basmati parfumé."],
  ["Tandoor naan filled with seasoned chicken.", "Naan au tandoor garni de poulet épicé."],
  ["Stuffed naan with chicken masala and fresh herbs.", "Naan farci au poulet masala et aux herbes fraîches."],
  ["Soft tandoor naan stuffed with melted cheese.", "Naan moelleux farci au fromage fondu."],
  ["Chicken pizza with house-made sauce.", "Pizza au poulet, sauce faite maison."],
  ["Butter chicken pizza with house-made sauce.", "Pizza butter chicken, sauce faite maison."],
  ["Two crisp pastry samosas with a spiced filling.", "Deux samosas croustillants à la farce épicée."],
  ["Four vegetable pakoras, fried until golden.", "Quatre pakoras de légumes, dorés à la friture."],
  ["Chicken + rice + 33 cl drink.", "Poulet + riz + boisson 33 cl."],
  ["Pizza of your choice + 33 cl drink.", "Pizza au choix + boisson 33 cl."],
  ["Filled naan + 33 cl drink.", "Naan garni + boisson 33 cl."],
  ["Chilled mango lassi, blended thick and smooth.", "Lassi mangue bien frais, onctueux et lisse."],
  ["Rose lassi with a light floral finish.", "Lassi à la rose, au parfum floral léger."],
  ["Plain yogurt lassi, lightly salted and refreshing.", "Lassi nature, légèrement salé et rafraîchissant."],
  ["Chilled soft drink, 33 cl.", "Boisson fraîche, 33 cl."],
];

export function dishDescription(description: string, lang: "en" | "fr") {
  const pair = DESCRIPTION_PAIRS.find(([en, fr]) => description === en || description === fr);
  if (!pair) return description;
  return lang === "fr" ? pair[1] : pair[0];
}

const NAME_PAIRS: [string, string][] = [
  ["Butter Chicken", "Poulet au beurre"],
  ["Chicken Masala", "Poulet masala"],
  ["Chicken Tikka Masala", "Poulet tikka masala"],
  ["Chicken Balti", "Poulet balti"],
  ["Poulet Shahi Korma", "Poulet shahi korma"],
  ["Dal Tadka", "Dal tadka"],
  ["Biryani Poulet", "Biryani poulet"],
  ["Biryani Végétarien", "Biryani végétarien"],
  ["Naan Poulet", "Naan poulet"],
  ["Naan Chicken Masala", "Naan poulet masala"],
  ["Cheese Naan", "Naan au fromage"],
  ["Pizza Chicken", "Pizza au poulet"],
  ["Pizza Butter Chicken", "Pizza poulet au beurre"],
  ["Samosa (2 pièces)", "Samosas (2 pièces)"],
  ["Pakora Légumes (4 pièces)", "Pakoras de légumes (4 pièces)"],
  ["Menu Butter Chicken", "Menu poulet au beurre"],
  ["Menu Pizza", "Menu pizza"],
  ["Menu Naan", "Menu naan"],
  ["Lassi Mangue", "Lassi mangue"],
  ["Lassi Rose", "Lassi rose"],
  ["Lassi Nature", "Lassi nature"],
  ["Boisson 33 cl", "Boisson 33 cl"],
  ["Supplément fromage", "Supplément fromage"],
  ["Sauce", "Sauce"],
];

export function dishName(name: string, lang: "en" | "fr") {
  const pair = NAME_PAIRS.find(([en, fr]) => name === en || name === fr);
  if (!pair) return name;
  return lang === "fr" ? pair[1] : pair[0];
}

export function dishesByCategory(slug: string) {
  if (slug === "all") return DISHES;
  return DISHES.filter((dish) => dish.category === slug);
}

export function dishSlug(dish: { id: string; name: string; slug?: string }) {
  if (dish.slug) return dish.slug;
  const base = dish.name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || dish.id;
}

export function dishPath(dish: { id: string; name: string; slug?: string }) {
  return `/plat/${dishSlug(dish)}`;
}
