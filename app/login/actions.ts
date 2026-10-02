"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, users } from "@/lib/db";
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession } from "@/lib/session";
import { MOBILE_RE } from "@/lib/format";

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

export type LoginState = { error?: string };

export async function loginAction(_prev: LoginState, form: FormData): Promise<LoginState> {
  const mobile = String(form.get("mobile") ?? "").trim();
  const pin = String(form.get("pin") ?? "").trim();
  const next = String(form.get("next") ?? "");

  if (!MOBILE_RE.test(mobile)) return { error: "Enter a valid 10-digit mobile number." };
  if (!/^\d{4,6}$/.test(pin)) return { error: "Enter your 4–6 digit PIN." };

  const [u] = await db.select().from(users).where(eq(users.mobile, mobile)).limit(1);
  if (!u) return { error: "Mobile number or PIN is incorrect." };
  if (!u.isActive) return { error: "This account is inactive. Please contact Toy Nation." };

  const now = new Date();
  if (u.lockedUntil && u.lockedUntil > now) {
    const mins = Math.ceil((u.lockedUntil.getTime() - now.getTime()) / 60000);
    return { error: `Too many wrong PINs. Try again in ${mins} minute${mins === 1 ? "" : "s"}.` };
  }

  const ok = await bcrypt.compare(pin, u.pinHash);
  if (!ok) {
    const attempts = (u.lockedUntil ? 0 : u.failedAttempts) + 1;
    if (attempts >= MAX_ATTEMPTS) {
      await db
        .update(users)
        .set({ failedAttempts: 0, lockedUntil: new Date(now.getTime() + LOCK_MINUTES * 60000) })
        .where(eq(users.id, u.id));
      return { error: `Too many wrong PINs. Account locked for ${LOCK_MINUTES} minutes.` };
    }
    await db.update(users).set({ failedAttempts: attempts, lockedUntil: null }).where(eq(users.id, u.id));
    return { error: `Mobile number or PIN is incorrect. ${MAX_ATTEMPTS - attempts} attempt(s) left.` };
  }

  await db.update(users).set({ failedAttempts: 0, lockedUntil: null }).where(eq(users.id, u.id));

  const token = await signSession({ uid: u.id, role: u.role });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "";
  if (u.role === "owner") redirect(safeNext.startsWith("/admin") ? safeNext : "/admin/orders");
  redirect(safeNext && !safeNext.startsWith("/admin") ? safeNext : "/products");
}

export async function logoutAction() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/");
}
