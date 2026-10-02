import { asc, eq } from "drizzle-orm";
import { db, users } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { toggleRetailer } from "./actions";
import { AddRetailerForm, EditRetailerForm, ResetPinForm } from "./RetailerForms";

export const metadata = { title: "Retailers – Toy Nation Admin" };

export default async function RetailersPage() {
  const list = await db
    .select({
      id: users.id,
      mobile: users.mobile,
      name: users.name,
      shopName: users.shopName,
      city: users.city,
      isActive: users.isActive,
      lockedUntil: users.lockedUntil,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.role, "retailer"))
    .orderBy(asc(users.shopName), asc(users.name));
  const now = new Date();

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <h1 className="text-2xl font-semibold text-brand-dark">Retailers</h1>
      <AddRetailerForm />

      <div className="card divide-y divide-gray-100">
        {list.length === 0 && <p className="p-6 text-center text-sm text-gray-500">No retailers yet.</p>}
        {list.map((r) => (
          <details key={r.id} className="group">
            <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 p-4 hover:bg-gray-50">
              <div className="min-w-0 flex-1">
                <div className="font-medium text-gray-900">{r.shopName} <span className="font-normal text-gray-500">· {r.name}</span></div>
                <div className="text-xs text-gray-500">+91 {r.mobile} · {r.city} · since {formatDate(r.createdAt)}</div>
              </div>
              {r.lockedUntil && r.lockedUntil > now && (
                <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-600">Locked</span>
              )}
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${r.isActive ? "bg-tn-teal/15 text-tn-teal" : "bg-gray-100 text-gray-500"}`}>
                {r.isActive ? "Active" : "Inactive"}
              </span>
              <span className="text-gray-400 transition group-open:rotate-180">▾</span>
            </summary>
            <div className="grid gap-6 border-t border-gray-100 bg-gray-50/50 p-4 md:grid-cols-[1fr_260px]">
              <EditRetailerForm r={r} />
              <div className="space-y-5">
                <ResetPinForm id={r.id} />
                <form action={toggleRetailer}>
                  <input type="hidden" name="id" value={r.id} />
                  <button className={r.isActive ? "btn w-full border border-red-200 bg-white text-red-600 hover:bg-red-50" : "btn-primary w-full"}>
                    {r.isActive ? "Deactivate" : "Activate"}
                  </button>
                </form>
              </div>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
