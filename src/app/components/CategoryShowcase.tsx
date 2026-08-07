import Link from 'next/link';

const categories = [
  { id: 'keyboards', name: 'Keyboards', description: 'Mechanical and wireless options.' },
  { id: 'mice', name: 'Mice', description: 'Everyday and performance-focused mice.' },
  { id: 'headsets', name: 'Headsets', description: 'Headsets for calls, games, and music.' },
  { id: 'monitors', name: 'Monitors', description: 'Displays for desk setups and gaming.' },
  { id: 'storage', name: 'Storage', description: 'Fast SSD storage for your system.' },
];

export default function CategoryShowcase() {
  return (
    <section className="px-6 py-16" aria-labelledby="category-heading">
      <div className="mx-auto max-w-screen-xl">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">Browse by category</p>
            <h2 id="category-heading" className="mt-2 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Find the right gear
            </h2>
          </div>
          <Link href="/products" className="btn-outline w-fit">View all products</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/products?category=${category.id}`}
              className="surface-card block p-5 transition-colors hover:border-primary"
            >
              <h3 className="text-lg font-bold text-card-foreground">{category.name}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{category.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
