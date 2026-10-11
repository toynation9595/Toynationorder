"use client";

import { useEffect, useState } from "react";
import { CartContext, createCartStore, type CartLine, type CartMode } from "@/lib/cart";

/** Mount with key={who} so a login/logout gets a brand-new store. */
export default function CartProvider({
  mode,
  who,
  initialLines,
  children,
}: {
  mode: CartMode;
  who: string;
  initialLines: CartLine[];
  children: React.ReactNode;
}) {
  const [store] = useState(() => createCartStore(mode, initialLines, who));
  useEffect(() => store.init(), [store]);
  return <CartContext.Provider value={store}>{children}</CartContext.Provider>;
}
