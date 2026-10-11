import Link from "next/link";
import { requireOwner } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";
import LogoTile from "@/components/LogoTile";
import AdminNav from "./AdminNav";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireOwner();
  return (
    <div className="flex min-h-full flex-1 flex-col bg-gray-50">
      <header className="bg-brand text-white">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <Link href="/admin/orders" className="flex items-center gap-2">
            <LogoTile size={38} />
            <span className="font-heading text-lg font-semibold">Admin</span>
          </Link>
          <div className="ml-auto flex items-center gap-2 text-sm">
            <Link href="/" className="rounded-lg px-3 py-1.5 hover:bg-white/10">View site</Link>
            <LogoutButton className="rounded-lg bg-white/10 px-3 py-1.5 hover:bg-white/20" />
          </div>
        </div>
        <AdminNav />
      </header>
      <main className="flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
