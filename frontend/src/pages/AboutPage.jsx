import { Gem, ShieldCheck, Sparkles } from 'lucide-react'

export function AboutPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <div className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm lg:p-10">
        <p className="text-sm uppercase tracking-[0.3em] text-amber-700">About JewelCart</p>
        <h1 className="mt-2 text-3xl text-stone-800">Crafted for those who value beauty, meaning, and lasting quality.</h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-stone-600">We blend modern design with timeless craftsmanship to create jewelry that feels personal, rare, and enduring.</p>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {[
            { icon: Sparkles, title: 'Design-led', text: 'Every collection is shaped around elegance and comfort.' },
            { icon: Gem, title: 'Certified Stones', text: 'Our gemstones are hand-selected for clarity and character.' },
            { icon: ShieldCheck, title: 'Trusted Service', text: 'From selection to delivery, every step is attended to with care.' },
          ].map((item) => {
            const Icon = item.icon
            return <div key={item.title} className="rounded-[1.25rem] border border-stone-200 bg-stone-50 p-6"><div className="inline-flex rounded-full bg-amber-100 p-2 text-amber-700"><Icon /></div><h2 className="mt-4 text-xl text-stone-800">{item.title}</h2><p className="mt-2 text-sm leading-7 text-stone-600">{item.text}</p></div>
          })}
        </div>
      </div>
    </div>
  )
}
<<<<<<< HEAD




=======
>>>>>>> a1085ac3f907c76d2adb17501784107a85c1a905
