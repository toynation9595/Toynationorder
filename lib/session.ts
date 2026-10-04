import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "tn_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 90; // 90 days

export type Role = "owner" | "retailer" | "employee";
export type SessionPayload = { uid: number; role: Role };

function key() {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET missing");
  return new TextEncoder().encode(s);
}

export async function signSession(p: SessionPayload): Promise<string> {
  return new SignJWT({ uid: p.uid, role: p.role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(key());
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    if (typeof payload.uid !== "number") return null;
    if (payload.role !== "owner" && payload.role !== "retailer" && payload.role !== "employee") return null;
    return { uid: payload.uid, role: payload.role };
  } catch {
    return null;
  }
}
