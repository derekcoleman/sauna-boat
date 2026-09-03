import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-24 text-center sm:px-8">
      <h1 className="text-3xl text-ink">That page is not here</h1>
      <p className="mt-4 text-stone">The tide took it. Head back to shore.</p>
      <Link href="/" className="mt-6 inline-block rounded-full bg-ink px-6 py-3 text-fog">
        Back to the boat
      </Link>
    </div>
  );
}
