import { ArrowRight, Gift } from "lucide-react";
import { Link } from "react-router-dom";

export function OffersPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <div className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm lg:p-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-amber-700">
              Exclusive Offers
            </p>
            <h1 className="mt-2 text-3xl text-stone-800">
              Luxury savings for your next statement piece.
            </h1>
          </div>
          <Link
            to="/jewelry"
            className="inline-flex items-center gap-2 text-sm font-semibold text-stone-700"
          >
            Browse favorites <ArrowRight size={16} />
          </Link>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {[
            "Bridal sparkle event",
            "Festival collections",
            "Member-only previews",
          ].map((offer) => (
            <div
              key={offer}
              className="rounded-[1.25rem] border border-stone-200 bg-stone-50 p-6"
            >
              <div className="inline-flex rounded-full bg-amber-100 p-2 text-amber-700">
                <Gift />
              </div>
              <h2 className="mt-4 text-xl text-stone-800">{offer}</h2>
              <p className="mt-2 text-sm leading-7 text-stone-600">
                Enjoy elevated savings for a limited period with complimentary
                gift wrapping.
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
