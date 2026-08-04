import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { useAppContext } from "../context/AppContext";

export function WishlistPage() {
  const { wishlist, addToCart, removeFromWishlist } = useAppContext();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <div className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-amber-700">
              Wishlist
            </p>
            <h1 className="mt-2 text-3xl text-stone-800">Your dream pieces</h1>
          </div>
          <Link to="/jewelry" className="text-sm font-semibold text-stone-700">
            Explore more
          </Link>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {wishlist.map((product) => (
            <div
              key={product.id}
              className="rounded-[1.25rem] border border-stone-200 p-5"
            >
              <img
                src={product.image}
                alt={product.name}
                className="h-48 w-full rounded-2xl object-cover"
              />
              <h3 className="mt-4 text-xl text-stone-800">{product.name}</h3>
              <p className="mt-2 text-sm text-stone-600">
                {product.description}
              </p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-lg font-semibold text-stone-900">
                  ₹{product.price.toLocaleString()}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => addToCart(product)}
                    className="rounded-full bg-stone-900 px-3 py-2 text-sm text-white"
                  >
                    <ShoppingBag size={16} />
                  </button>
                  <button
                    onClick={() => removeFromWishlist(product.id)}
                    className="rounded-full border border-stone-200 px-3 py-2 text-sm text-stone-700"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
          {wishlist.length === 0 && (
            <div className="rounded-[1.25rem] border border-dashed border-stone-300 p-10 text-center text-stone-500 md:col-span-2 xl:col-span-3">
              Your wishlist is waiting for your next signature piece.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
