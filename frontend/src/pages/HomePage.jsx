import { Link } from 'react-router-dom'
import { ArrowRight, BadgeCheck, Gem, ShieldCheck, Sparkles, Truck } from 'lucide-react'
import { motion } from 'framer-motion'
import { useEffect, useState } from "react";
import { getProducts} from "../api/products";

const featuredCollections = [
  { title: 'Bridal Collection', description: 'Heirloom-inspired bridal jewelry for unforgettable vows.' },
  { title: 'Limited Edition', description: 'Exclusive drops with rare gemstone craftsmanship.' },
  { title: 'Luxury Watches', description: 'Swiss-inspired precision with a sculptural silhouette.' },
]

export function HomePage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
  const fetchProducts = async () => {
    try {
      const data = await getProducts();
      console.log("Fetched products:", data);
      const items = data.items || [];
      // items = items.filter(item => item.badge === "New Arrival");
      setProducts(items);
    } catch (err) {
      console.error(err);
      setError("Unable to load products.");
    } finally {
      setLoading(false);
    }
  };
 
  fetchProducts();
}, []);
useEffect(() => {
    console.log("Products changed:", products);
  }, [products]);
if (loading) {
  return (
    <div className="flex h-[60vh] items-center justify-center">
      Loading products...
    </div>
  );
}
if (error) {
  return (
    <div className="flex h-[60vh] items-center justify-center text-red-600">
      {error}
    </div>
  );
}
  return (
    <div className="pb-20">
      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-[2rem] bg-stone-900 p-10 text-white shadow-[0_40px_80px_rgba(39,25,16,0.2)] lg:p-14">
          <p className="text-sm uppercase tracking-[0.4em] text-amber-300">Luxury Reimagined</p>
          <h1 className="mt-4 text-4xl leading-tight sm:text-5xl lg:text-6xl">Fine jewelry designed for modern heirlooms.</h1>
          <p className="mt-6 max-w-xl text-lg text-stone-300">Discover signature rings, sculptural necklaces, and rare gemstones curated for everyday radiance and grand occasions.</p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link to="/jewelry" className="rounded-full bg-amber-500 px-6 py-3 font-medium text-stone-950 transition hover:bg-amber-400">Shop Collection</Link>
            <Link to="/products/1" className="rounded-full border border-white/20 px-6 py-3 font-medium text-white transition hover:bg-white/10">Explore Best Sellers</Link>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-[0_25px_60px_rgba(97,70,38,0.12)]">
          <img src="https://heerhaarjewellery.com/wp-content/uploads/2026/03/Untitled-design.jpg" alt="Luxury jewelry showcase" className="h-full min-h-[420px] w-full object-cover" />
        </motion.div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-amber-700">Featured Collections</p>
            <h2 className="mt-2 text-3xl text-stone-800">Signature moments, beautifully framed.</h2>
          </div>
          <Link to="/jewelry" className="hidden text-sm font-semibold text-stone-700 hover:text-amber-700 md:block">View All</Link>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {featuredCollections.map((collection) => (
            <div key={collection.title} className="rounded-[1.5rem] border border-stone-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700"><Sparkles /></div>
              <h3 className="text-2xl text-stone-800">{collection.title}</h3>
              <p className="mt-3 text-sm leading-7 text-stone-600">{collection.description}</p>
              <Link to="/jewelry" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-amber-700">Shop now <ArrowRight size={16} /></Link>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-amber-700">New Arrivals</p>
            <h2 className="mt-2 text-3xl text-stone-800">Freshly crafted pieces for special occasions.</h2>
          </div>
          <Link to="/jewelry" className="hidden text-sm font-semibold text-stone-700 hover:text-amber-700 md:block">Browse All</Link>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {products.filter(product => product.badge === "New Arrival").map((product) => (
            <div key={product.id} className="overflow-hidden rounded-[1.5rem] border border-stone-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
              <img src={product.image} alt={product.name} className="h-60 w-full object-cover" />
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm uppercase tracking-[0.3em] text-stone-500">{product.category}</p>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">{product.badge}</span>
                </div>
                <h3 className="mt-3 text-xl text-stone-800">{product.name}</h3>
                <p className="mt-2 text-sm text-stone-600">{product.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-lg font-semibold text-stone-900">₹{product.msrp ? product.msrp.toLocaleString() : "N/A"}</p>
                  <Link to={`/products/${product.id}`} className="text-sm font-semibold text-amber-700">View</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        <div className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm lg:p-10">
          <div className="grid gap-6 lg:grid-cols-[1fr_0.7fr]">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-amber-700">Certified Jewelry</p>
              <h2 className="mt-2 text-3xl text-stone-800">Trusted craftsmanship, ethically sourced gemstones, and timeless design.</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {[
                  { icon: BadgeCheck, title: 'Hallmarked Gold', text: 'Verified purity with official hallmarking.' },
                  { icon: Gem, title: 'Conflict-Free Diamonds', text: 'Ethically sourced stones and transparent provenance.' },
                  { icon: ShieldCheck, title: 'Secure Checkout', text: 'Protected payments and insured delivery.' },
                  { icon: Truck, title: 'Free Shipping', text: 'Complimentary express delivery on luxury pieces.' },
                ].map((item) => {
                  const Icon = item.icon
                  return <div key={item.title} className="rounded-2xl bg-stone-50 p-4"><div className="mb-3 inline-flex rounded-full bg-amber-100 p-2 text-amber-700"><Icon /></div><h3 className="text-lg text-stone-800">{item.title}</h3><p className="mt-2 text-sm leading-7 text-stone-600">{item.text}</p></div>
                })}
              </div>
            </div>
            <div className="overflow-hidden rounded-[1.5rem]">
              <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTKEzMIBp78YftiV0wmIDYv8KkYVKSYKbpUqgaNOYby1TwQzApAoBpqEo4&s=10" alt="Luxury jewelry closeup" className="h-full min-h-[320px] w-full object-cover" />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
