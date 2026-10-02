import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

/**
 * Signed cookie listing order numbers placed from this browser, so a guest can
 * open their own confirmation page without exposing other customers' orders.
 */
const COOKIE = "tn_placed";
const MAX = 20;

function key() {
  return new TextEncoder().encode(process.env.SESSION_SECRET!);
}

export async function getPlacedOrders(): Promise<number[]> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return [];
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    return Array.isArray(payload.o) ? payload.o.filter((n): n is number => typeof n === "number") : [];
  } catch {
    return [];
  }
}

export async function rememberPlacedOrder(orderNo: number) {
  const list = [orderNo, ...(await getPlacedOrders()).filter((n) => n !== orderNo)].slice(0, MAX);
  const token = await new SignJWT({ o: list })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(key());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}
