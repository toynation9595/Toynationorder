import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, users } from "@/lib/db";
import { SESSION_COOKIE, verifySession } from "@/lib/session";
import type { PriceType } from "@/lib/pricing";

export type CurrentUser = {
  id: number;
  role: "owner" | "retailer" | "employee";
  name: string;
  mobile: string;
  shopName: string;
  city: string;
};

/** The logged-in, active user (checked against the DB), or null. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const store = await cookies();
  const session = await verifySession(store.get(SESSION_COOKIE)?.value);
  if (!session) return null;
  const [u] = await db
    .select({
      id: users.id,
      role: users.role,
      name: users.name,
      mobile: users.mobile,
      shopName: users.shopName,
      city: users.city,
      isActive: users.isActive,
    })
    .from(users)
    .where(eq(users.id, session.uid))
    .limit(1);
  if (!u || !u.isActive) return null;
  return { id: u.id, role: u.role, name: u.name, mobile: u.mobile, shopName: u.shopName, city: u.city };
});

/** Pricing tier is decided here, on the server, from the session only. */
export async function getPriceType(): Promise<PriceType> {
  const u = await getCurrentUser();
  return u?.role === "retailer" ? "wholesale" : "retail";
}

export async function requireOwner(): Promise<CurrentUser> {
  const u = await getCurrentUser();
  if (!u || u.role !== "owner") redirect("/login?next=/admin/orders");
  return u;
}

/** Packing staff: employees, and the owner (who may also open /staff). */
export async function requireStaff(): Promise<CurrentUser> {
  const u = await getCurrentUser();
  if (!u || (u.role !== "employee" && u.role !== "owner")) redirect("/login?next=/staff/orders");
  return u;
}

/** Where each role lands after login. */
export function homeFor(role: CurrentUser["role"]): string {
  return role === "owner" ? "/admin/orders" : role === "employee" ? "/staff/orders" : "/products";
}

export async function requireRetailer(): Promise<CurrentUser> {
  const u = await getCurrentUser();
  if (!u || u.role !== "retailer") redirect("/login?next=/my-orders");
  return u;
}
