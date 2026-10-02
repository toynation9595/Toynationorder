import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);

  const allowed = pathname.startsWith("/admin")
    ? session?.role === "owner"
    : pathname.startsWith("/my-orders")
      ? session?.role === "retailer"
      : true;

  if (!allowed) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/my-orders/:path*"],
};
