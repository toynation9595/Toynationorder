"use client";

import { useContext } from "react";
import { CartContext, clearClientCarts } from "@/lib/cart";
import { logoutAction } from "@/app/login/actions";

/** Clears the in-memory and stored client carts, then signs out (server redirects). */
export default function LogoutButton({ className, formClassName }: { className?: string; formClassName?: string }) {
  const store = useContext(CartContext);
  return (
    <form
      className={formClassName}
      action={async () => {
        store?.clear();
        clearClientCarts();
        await logoutAction();
      }}
    >
      <button className={className}>Logout</button>
    </form>
  );
}
