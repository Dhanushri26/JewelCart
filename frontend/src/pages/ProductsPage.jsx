import { useMemo, useState ,useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Search, SlidersHorizontal } from 'lucide-react'
import { useAppContext } from '../context/AppContext'
import { getProducts } from '../api/products'
import {addCartItem} from '../api/cart'
const categories = ['Jewelry', 'Gemstones', 'Collections', 'New Arrivals']

export function ProductsPage() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [sort, setSort] = useState('featured')
  const { addToCart, addToWishlist } = useAppContext()
  const [error, setError] = useState("");
  const [products, setProducts] = useState([]);

 useEffect(() => {
  const fetchProducts = async () => {
    try {
      const data = await getProducts();
      console.log("Fetched products:", data);
      const items = (data.items || []).map((product) => ({
  ...product,
  name: product.title,
  price: product.msrp,
}));
setProducts(items);
      setProducts(items);
    } catch (err) {
      console.error(err);
      setError("Unable to load products.");
    } 
  };

  fetchProducts();
}, []);

const filteredProducts = useMemo(() => {
  return products
    .filter((product) => {
      const matchesQuery =
        `${product.name} ${product.description} ${product.category}`
          .toLowerCase()
          .includes(query.toLowerCase());

      const matchesCategory =
        category === "All" || product.category === category;

      return matchesQuery && matchesCategory;
    })
    .sort((a, b) => {
      switch (sort) {
        case "price-low":
          return a.price - b.price;

        case "price-high":
          return b.price - a.price;

        case "rating":
          return (b.rating ?? 4.8) - (a.rating ?? 4.8);

        default:
          return a.name.localeCompare(b.name);
      }
    });
}, [products, query, category, sort]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-amber-700">Curated Collection</p>
            <h1 className="mt-2 text-3xl text-stone-800">Browse our signature jewelry pieces.</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-4 py-2">
              <Search className="text-stone-500" size={16} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search pieces" className="bg-transparent outline-none" />
            </label>
            <label className="flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-4 py-2">
              <SlidersHorizontal size={16} className="text-stone-500" />
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="bg-transparent outline-none">
                <option>All</option>
                {categories.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-full border border-stone-200 bg-stone-50 px-4 py-2 outline-none">
              <option value="featured">Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[250px_1fr]">
        <aside className="rounded-[1.5rem] border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl text-stone-800">Refine</h2>
          <div className="mt-4 space-y-4 text-sm text-stone-600">
            <div><p className="font-semibold text-stone-800">Metal</p><p className="mt-2">Gold, Rose Gold, Silver, Platinum</p></div>
            <div><p className="font-semibold text-stone-800">Stone</p><p className="mt-2">Diamond, Emerald, Sapphire, Pearl</p></div>
            <div><p className="font-semibold text-stone-800">Price</p><p className="mt-2">₹1,200 - ₹15,000</p></div>
            <div><p className="font-semibold text-stone-800">Availability</p><p className="mt-2">In stock and preorder</p></div>
          </div>
        </aside>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredProducts.slice(0, 24).map((product) => (
            <div key={product.id} className="group overflow-hidden rounded-[1.5rem] border border-stone-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <div className="relative">
                <img src={product.image} alt={product.name} className="h-60 w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <button onClick={() => addToWishlist(product)} className="absolute right-4 top-4 rounded-full bg-white/90 p-2 text-stone-700"><Heart size={16} /></button>
              </div>
              <div className="p-5">
                {/* <div className="flex items-center justify-between text-sm text-stone-500">
                  <span>{product.category}</span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${product.stock > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{product.stock > 0 ? 'In Stock' : 'Sold Out'}</span>
                </div> */}
                <h3 className="mt-3 text-xl text-stone-800">{product.name}</h3>
                <div className="mt-2 flex items-center justify-between text-sm text-stone-600">
<span>⭐ {product.rating ?? 4.8}</span>
<span>{product.reviews ?? 120} reviews</span>                </div>
                <div className="mt-4 flex items-center justify-between">
                  {/* <div>
                    <p className="text-lg font-semibold text-stone-900">₹{product.price.toLocaleString()}</p>
                    {product.discount > 0 && <p className="text-sm text-amber-700">Save {product.discount}%</p>}
                  </div> */}
                  <div className="flex gap-2">
                    <Link to={`/products/${product.id}`} className="rounded-full border border-stone-200 px-3 py-2 text-sm text-stone-700">Quick View</Link>
                    <button onClick={() => addToCart(product)} className="rounded-full bg-stone-900 px-3 py-2 text-sm text-white">Add</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
