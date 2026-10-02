import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import LogoTile from "@/components/LogoTile";
import LoginForm from "./LoginForm";

export const metadata = { title: "Sign in – Toy Nation" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : "";
  const user = await getCurrentUser();
  if (user) redirect(user.role === "owner" ? "/admin/orders" : "/products");

  return (
    <main className="flex flex-1 items-center justify-center bg-brand-light/50 px-4 py-12">
      <div className="card w-full max-w-sm p-6 sm:p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <LogoTile size={72} />
          <h1 className="mt-4 text-2xl font-semibold text-brand-dark">Sign in</h1>
          <p className="mt-1 text-sm text-gray-500">Retailers sign in to see wholesale prices and their orders.</p>
        </div>
        <LoginForm next={next} />
        <p className="mt-6 text-center text-xs text-gray-500">
          Retailer accounts are created by Toy Nation.{" "}
          <Link href="/products" className="font-medium text-brand hover:underline">Browse as guest</Link>
        </p>
      </div>
    </main>
  );
}
