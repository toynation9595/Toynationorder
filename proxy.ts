import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

/*
 * Route guard (runs on every page request):
 *  /admin/*     → owner only
 *  /my-orders/* → retailer only
 *  /staff/*     → employee or owner
 *  employees may use ONLY /staff/* (and /login); anything else sends them to /staff/orders.
 */
export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  const role = session?.role;

  if (role === "employee" && !pathname.startsWith("/staff") && pathname !== "/login") {
    return NextResponse.redirect(new URL("/staff/orders", req.url));
  }

  const allowed = pathname.startsWith("/admin")
    ? role === "owner"
    : pathname.startsWith("/my-orders")
      ? role === "retailer"
      : pathname.startsWith("/staff")
        ? role === "employee" || role === "owner"
        : true;

  if (!allowed) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // Every page and server action; skip static assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo.png|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)"],
};
