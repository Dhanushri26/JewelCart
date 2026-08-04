import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(135deg,#fcf8f1_0%,#f7eee3_100%)] px-4">
      <div className="rounded-[2rem] border border-stone-200 bg-white p-10 text-center shadow-sm">
        <p className="text-sm uppercase tracking-[0.3em] text-amber-700">404</p>
        <h1 className="mt-3 text-4xl text-stone-800">Page not found</h1>
        <p className="mt-4 text-stone-600">The page you are looking for does not exist in our collection.</p>
        <Link to="/" className="mt-6 inline-flex rounded-full bg-stone-900 px-6 py-3 font-medium text-white">Return Home</Link>
      </div>
    </div>
  )
}
