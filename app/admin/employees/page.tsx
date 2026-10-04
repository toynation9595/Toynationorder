import { asc, eq } from "drizzle-orm";
import { db, users } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { toggleEmployee } from "./actions";
import { AddEmployeeForm, EditEmployeeForm, ResetEmployeePinForm } from "./EmployeeForms";

export const metadata = { title: "Employees – Toy Nation Admin" };

export default async function EmployeesPage() {
  const list = await db
    .select({
      id: users.id,
      mobile: users.mobile,
      name: users.name,
      isActive: users.isActive,
      lockedUntil: users.lockedUntil,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.role, "employee"))
    .orderBy(asc(users.name));
  const now = new Date();

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-brand-dark">Employees</h1>
        <p className="text-sm text-gray-500">Employees sign in with mobile + PIN and can only use the packing screens (/staff).</p>
      </div>
      <AddEmployeeForm />

      <div className="card divide-y divide-gray-100">
        {list.length === 0 && <p className="p-6 text-center text-sm text-gray-500">No employees yet.</p>}
        {list.map((e) => (
          <details key={e.id} className="group">
            <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 p-4 hover:bg-gray-50">
              <div className="min-w-0 flex-1">
                <div className="font-medium text-gray-900">{e.name}</div>
                <div className="text-xs text-gray-500">+91 {e.mobile} · since {formatDate(e.createdAt)}</div>
              </div>
              {e.lockedUntil && e.lockedUntil > now && (
                <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-600">Locked</span>
              )}
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${e.isActive ? "bg-tn-teal/15 text-tn-teal" : "bg-gray-100 text-gray-500"}`}>
                {e.isActive ? "Active" : "Inactive"}
              </span>
              <span className="text-gray-400 transition group-open:rotate-180">▾</span>
            </summary>
            <div className="grid gap-6 border-t border-gray-100 bg-gray-50/50 p-4 md:grid-cols-[1fr_260px]">
              <EditEmployeeForm e={e} />
              <div className="space-y-5">
                <ResetEmployeePinForm id={e.id} />
                <form action={toggleEmployee}>
                  <input type="hidden" name="id" value={e.id} />
                  <button className={e.isActive ? "btn w-full border border-red-200 bg-white text-red-600 hover:bg-red-50" : "btn-primary w-full"}>
                    {e.isActive ? "Deactivate" : "Activate"}
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
