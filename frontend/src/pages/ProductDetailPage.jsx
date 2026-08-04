import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Heart, Loader2, Share2, Star } from "lucide-react";
import { getProductById, normalizeProduct } from "../api/products";
import { useAppContext } from "../context/AppContext";

export function ProductDetailPage() {
  const { id } = useParams();
  const { addToCart, addToWishlist } = useAppContext();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError("");

    getProductById(id)
      .then((data) => {
        // Lambda may return the product directly or nested under a key
        const raw = data?.product ?? data?.item ?? data;
        setProduct(normalizeProduct(raw));
      })
      .catch((err) => {
        console.error("[ProductDetailPage] fetch error:", err);
        setError("Product not found or unavailable.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  // ── Loading state ──
  if (loading) {
    return (
      <div className="mx-auto flex max-w-7xl items-center justify-center px-4 py-32">
        <Loader2 className="animate-spin text-amber-600" size={36} />
      </div>
    );
  }

  // ── Error / not found ──
  if (error || !product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <p className="text-stone-500">{error || "Product not found."}</p>
        <Link
          to="/jewelry"
          className="mt-6 inline-block rounded-full border border-stone-200 px-6 py-2.5 text-sm text-stone-700"
        >
          ← Back to collection
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <Link
        to="/jewelry"
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-stone-700"
      >
        <ArrowLeft size={16} /> Back to collection
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        {/* Product image */}
        <div className="overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-sm">
          <img
            src={product.image}
            alt={product.name}
            className="h-[480px] w-full object-cover"
            id={`product-image-${product.id}`}
          />
        </div>

        {/* Product details */}
        <div className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm">
          <p className="text-sm uppercase tracking-[0.3em] text-amber-700">
            {product.category}
          </p>
          <h1 className="mt-3 text-4xl text-stone-800">{product.name}</h1>
          <p className="mt-4 text-base leading-8 text-stone-600">
            {product.description}
          </p>

          <div className="mt-6 flex items-center gap-4">
            <div className="text-3xl font-semibold text-stone-900">
              ₹{product.price.toLocaleString("en-IN")}
            </div>
            {product.discount > 0 && (
              <div className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700">
                {product.discount}% off
              </div>
            )}
          </div>

          {/* Spec grid */}
          <div className="mt-6 grid gap-4 rounded-[1.25rem] bg-stone-50 p-4 text-sm text-stone-600 sm:grid-cols-2">
            <div>
              <span className="font-semibold text-stone-800">
                Availability:{" "}
              </span>
              {product.stock > 0 ? "In stock" : "Preorder"}
            </div>
            <div>
              <span className="font-semibold text-stone-800">SKU: </span>
              {product.id}
            </div>
            {product.metal && (
              <div>
                <span className="font-semibold text-stone-800">Metal: </span>
                {product.metal}
              </div>
            )}
            {product.stone && (
              <div>
                <span className="font-semibold text-stone-800">Stone: </span>
                {product.stone}
              </div>
            )}
            {product.purity && (
              <div>
                <span className="font-semibold text-stone-800">Purity: </span>
                {product.purity}
              </div>
            )}
            {product.weight && (
              <div>
                <span className="font-semibold text-stone-800">Weight: </span>
                {product.weight}
              </div>
            )}
          </div>

          {/* CTA buttons */}
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={() => addToCart(product)}
              id={`add-to-cart-${product.id}`}
              className="rounded-full bg-stone-900 px-6 py-3 font-medium text-white"
            >
              Add to Cart
            </button>
            <button
              onClick={() => addToWishlist(product)}
              id={`add-to-wishlist-${product.id}`}
              className="rounded-full border border-stone-200 px-6 py-3 font-medium text-stone-700"
            >
              Wishlist
            </button>
            <button className="rounded-full border border-stone-200 p-3 text-stone-700">
              <Share2 size={18} />
            </button>
          </div>

          {/* Reviews */}
          <div className="mt-8 border-t border-stone-200 pt-6">
            <h2 className="text-xl text-stone-800">Customer Reviews</h2>
            <div className="mt-4 flex items-center gap-2 text-amber-500">
              <Star size={18} fill="currentColor" />
              <span className="font-semibold text-stone-800">
                {product.rating}
              </span>
              <span className="text-stone-600">
                ({product.reviews} reviews)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
