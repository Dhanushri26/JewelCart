import api from "./axios";

// ──────────────────────────────────────────────────────────────
// PRODUCT SERVICE  →  /products
// ──────────────────────────────────────────────────────────────

/**
 * Fetch the full product catalog.
 * Response: { items: Product[] }
 */
export const getProducts = async () => {
  const response = await api.get("/products");
  return response.data;
};

/**
 * Fetch a single product by its productId.
 * Response: Product
 */
export const getProductById = async (productId) => {
  const response = await api.get(`/products/${productId}`);
  return response.data;
};

export const createProduct = async (data) => {
  const response = await api.post("/products", data);
  return response.data;
};
/**
 * Normalize a Lambda product record to the frontend shape used by pages.
 * Lambda returns: { productId, title, msrp, isActive, ... }
 * Frontend expects: { id, name, price, image, ... }
 *
 *
 *
 */

export async function updateProduct(productId, body) {
  const response = await api.put(`/products/${productId}`, body);

  return response.data;
}

export const normalizeProduct = (p) => ({
  ...p,
  id: p.productId ?? p.id,
  name: p.title ?? p.name ?? "Untitled",
  price: Number(p.msrp ?? p.price ?? 0),
  image:
    p.imageUrl ??
    p.image ??
    `https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80`,
  rating: p.rating ?? 4.8,
  reviews: p.reviewCount ?? p.reviews ?? 120,
  category: p.category ?? "Jewelry",
  description:
    p.description ??
    "Crafted in our atelier with certified stones and exceptional brilliance.",
  stock: p.stock ?? 10,
  discount: p.discount ?? 0,
  metal: p.metal ?? "Gold",
  stone: p.stone ?? "Diamond",
  purity: p.purity ?? "18K",
  weight: p.weight ?? "3.5 g",
});
