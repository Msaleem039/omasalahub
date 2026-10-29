import { DISHES, type Dish } from "../data/menuData";

const KEY = "omasalahub_products";

export function readProducts(): Dish[] {
  if (typeof window === "undefined") return DISHES;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DISHES;
    const parsed = JSON.parse(raw) as Dish[];
    return Array.isArray(parsed) ? parsed : DISHES;
  } catch {
    return DISHES;
  }
}

export function writeProducts(dishes: Dish[]) {
  localStorage.setItem(KEY, JSON.stringify(dishes));
}

export function readImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that image."));
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const max = 960;
        const scale = Math.min(1, max / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Could not prepare that image."));
          return;
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.72));
      };
      image.onerror = () => reject(new Error("Could not read that image."));
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
