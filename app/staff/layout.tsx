import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";
import LogoTile from "@/components/LogoTile";

export default async function StaffLayout({ children }: LayoutProps<"/staff">) {
  const me = await requireStaff();
  return (
    <div className="flex min-h-full flex-1 flex-col bg-gray-50">
      <header className="sticky top-0 z-30 bg-brand text-white shadow-md">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-2.5">
          <Link href="/staff/orders" className="flex items-center gap-2">
            <LogoTile size={36} />
            <span className="font-heading text-lg font-semibold">Packing</span>
          </Link>
          <div className="ml-auto flex items-center gap-1 text-sm">
            <span className="hidden text-white/80 sm:inline">{me.name}</span>
            {me.role === "owner" && (
              <Link href="/admin/orders" className="rounded-lg px-3 py-1.5 hover:bg-white/10">Admin</Link>
            )}
            <LogoutButton className="rounded-lg bg-white/10 px-3 py-1.5 hover:bg-white/20" />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-3 py-4 sm:px-4">{children}</main>
    </div>
  );
}
