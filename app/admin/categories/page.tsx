import { asc, count, eq } from "drizzle-orm";
import { db, categories, products } from "@/lib/db";
import { addCategory, moveCategory, renameCategory, toggleCategory } from "./actions";

export const metadata = { title: "Categories – Toy Nation Admin" };

export default async function CategoriesPage() {
  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      isActive: categories.isActive,
      products: count(products.id),
    })
    .from(categories)
    .leftJoin(products, eq(products.categoryId, categories.id))
    .groupBy(categories.id)
    .orderBy(asc(categories.sortOrder), asc(categories.id));

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-5 text-2xl font-semibold text-brand-dark">Categories</h1>

      <form action={addCategory} className="card mb-5 flex gap-2 p-4">
        <input name="name" required placeholder="New category name" className="input" />
        <button className="btn-primary shrink-0">Add</button>
      </form>

      <div className="card divide-y divide-gray-100">
        {rows.length === 0 && <p className="p-6 text-center text-sm text-gray-500">No categories yet.</p>}
        {rows.map((c, i) => (
          <div key={c.id} className="flex flex-wrap items-center gap-2 p-3">
            <div className="flex flex-col">
              <form action={moveCategory}>
                <input type="hidden" name="id" value={c.id} />
                <input type="hidden" name="dir" value="up" />
                <button disabled={i === 0} aria-label="Move up" className="px-2 text-gray-500 hover:text-brand disabled:opacity-25">▲</button>
              </form>
              <form action={moveCategory}>
                <input type="hidden" name="id" value={c.id} />
                <input type="hidden" name="dir" value="down" />
                <button disabled={i === rows.length - 1} aria-label="Move down" className="px-2 text-gray-500 hover:text-brand disabled:opacity-25">▼</button>
              </form>
            </div>
            <form action={renameCategory} className="flex min-w-0 flex-1 gap-2">
              <input type="hidden" name="id" value={c.id} />
              <input name="name" defaultValue={c.name} required className="input min-w-0" />
              <button className="btn-outline shrink-0">Save</button>
            </form>
            <span className="w-20 text-xs text-gray-500">{c.products} products</span>
            <form action={toggleCategory}>
              <input type="hidden" name="id" value={c.id} />
              <button
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  c.isActive ? "bg-tn-teal/15 text-tn-teal" : "bg-gray-100 text-gray-500"
                }`}
              >
                {c.isActive ? "Active" : "Inactive"}
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
