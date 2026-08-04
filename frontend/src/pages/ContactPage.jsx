import { Mail, Phone, MapPin } from 'lucide-react'

export function ContactPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm">
          <p className="text-sm uppercase tracking-[0.3em] text-amber-700">Contact JewelCart</p>
          <h1 className="mt-2 text-3xl text-stone-800">Book a private consultation.</h1>
          <div className="mt-8 space-y-4 text-sm text-stone-600">
            <div className="flex items-center gap-3"><Mail className="text-amber-700" /><span>hello@jewelcart.com</span></div>
            <div className="flex items-center gap-3"><Phone className="text-amber-700" /><span>+91 99999 12345</span></div>
            <div className="flex items-center gap-3"><MapPin className="text-amber-700" /><span>24, Rosewood Avenue, Luxury District</span></div>
          </div>
        </div>
        <div className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl text-stone-800">Let us help you find your perfect piece</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <input className="rounded-full border border-stone-200 bg-stone-50 px-4 py-3" placeholder="Name" />
            <input className="rounded-full border border-stone-200 bg-stone-50 px-4 py-3" placeholder="Email" />
            <input className="rounded-full border border-stone-200 bg-stone-50 px-4 py-3 md:col-span-2" placeholder="Inquiry" />
            <textarea className="min-h-32 rounded-[1.25rem] border border-stone-200 bg-stone-50 px-4 py-3 md:col-span-2" placeholder="Tell us what you are looking for" />
          </div>
          <button className="mt-6 rounded-full bg-stone-900 px-6 py-3 text-white">Request Consultation</button>
        </div>
      </div>
    </div>
  )
}
