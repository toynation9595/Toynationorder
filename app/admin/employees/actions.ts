"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { and, eq, ne, sql } from "drizzle-orm";
import { db, users } from "@/lib/db";
import { requireOwner } from "@/lib/auth";
import { MOBILE_RE } from "@/lib/format";

export type FormState = { error?: string; ok?: string };

const PIN_RE = /^\d{4,6}$/;

function fields(form: FormData) {
  return {
    mobile: String(form.get("mobile") ?? "").trim(),
    name: String(form.get("name") ?? "").trim().slice(0, 100),
  };
}

function validate(f: ReturnType<typeof fields>): string | null {
  if (!MOBILE_RE.test(f.mobile)) return "Enter a valid 10-digit mobile number.";
  if (!f.name) return "Name is required.";
  return null;
}

async function mobileTaken(mobile: string, exceptId?: number) {
  const [u] = await db
    .select({ id: users.id })
    .from(users)
    .where(exceptId ? and(eq(users.mobile, mobile), ne(users.id, exceptId)) : eq(users.mobile, mobile));
  return !!u;
}

const isEmployee = (id: number) => and(eq(users.id, id), eq(users.role, "employee"));

export async function addEmployee(_prev: FormState, form: FormData): Promise<FormState> {
  await requireOwner();
  const f = fields(form);
  const pin = String(form.get("pin") ?? "").trim();
  const err = validate(f) ?? (PIN_RE.test(pin) ? null : "PIN must be 4–6 digits.");
  if (err) return { error: err };
  if (await mobileTaken(f.mobile)) return { error: "An account with this mobile already exists." };
  await db.insert(users).values({ ...f, pinHash: await bcrypt.hash(pin, 10), role: "employee" });
  revalidatePath("/admin/employees");
  return { ok: `Employee ${f.name} added.` };
}

export async function updateEmployee(_prev: FormState, form: FormData): Promise<FormState> {
  await requireOwner();
  const id = Number(form.get("id"));
  const f = fields(form);
  const err = validate(f);
  if (err) return { error: err };
  if (await mobileTaken(f.mobile, id)) return { error: "Another account uses this mobile." };
  await db.update(users).set(f).where(isEmployee(id));
  revalidatePath("/admin/employees");
  return { ok: "Saved." };
}

export async function resetEmployeePin(_prev: FormState, form: FormData): Promise<FormState> {
  await requireOwner();
  const id = Number(form.get("id"));
  const pin = String(form.get("pin") ?? "").trim();
  if (!PIN_RE.test(pin)) return { error: "PIN must be 4–6 digits." };
  await db
    .update(users)
    .set({ pinHash: await bcrypt.hash(pin, 10), failedAttempts: 0, lockedUntil: null })
    .where(isEmployee(id));
  revalidatePath("/admin/employees");
  return { ok: "PIN reset." };
}

export async function toggleEmployee(form: FormData) {
  await requireOwner();
  const id = Number(form.get("id"));
  await db.update(users).set({ isActive: sql`not ${users.isActive}` }).where(isEmployee(id));
  revalidatePath("/admin/employees");
}
