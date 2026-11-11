# Toy Nation – Wholesale Catalogue & Order Portal

Brand website + order management for Toy Nation (toys & seasonal wholesale, Nashik). Live: https://toynation.vercel.app
Address (footer/About): Rajneel Square, Near Indian Oil Pump, Mumbai-Agra Service Road, Ojhar (MIG), Nashik, Maharashtra 422207.

## Working rules
- Build only what is asked. No extra features, no refactors, no placeholders.
- NO tests, no test frameworks, no test files. After each change run `npm run build` (and `npx eslint .`); fix errors; commit.
- Keep explanations short.

## Stack
- Next.js 16 (App Router, TS, Server Components + Server Actions/Route Handlers). Route guard file is `proxy.ts` (not middleware). `cacheComponents` is OFF; pages showing stock/price use `export const dynamic = "force-dynamic"`. Read `node_modules/next/dist/docs/` before using unfamiliar APIs.
- Tailwind CSS v4 (theme tokens in app/globals.css; `@apply` of custom classes is not allowed).
- Neon Postgres + Drizzle ORM via the **Pool/websocket driver** (`drizzle-orm/neon-serverless`, lib/db/index.ts) — transactions + `SELECT … FOR UPDATE` rely on it. drizzle-kit for migrations.
- Auth: custom. bcryptjs PIN hashes, `jose` JWT in httpOnly cookie `tn_session` (90 days). Lockout 15 min after 5 wrong PINs.
- Images: Cloudinary Upload Widget (signed via /api/admin/cloudinary-sign, folders `toynation/products` and `toy-nation/banners` only); URLs from `cldUrl()` in lib/images.ts (`f_auto,q_auto,w_400` cards, `w_1200` detail) and `bannerImageUrl()` in lib/banner-presets.ts (`c_fill,g_auto,ar_12:7,f_auto,q_auto,w_800`). No Vercel image optimisation.
- Icons: lucide-react (no emoji in the UI).
- Excel import: SheetJS (`xlsx` 0.20.3 from cdn.sheetjs.com) parsed in the browser, rows POSTed as JSON.
- Hosting: Vercel project `toynation`; GitHub `toynation9595/Toynationorder` (branch main). One Neon DB (dev and prod share it).

## Env vars
DATABASE_URL, SESSION_SECRET, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
NEXT_PUBLIC_OWNER_WHATSAPP (10 digits; order WhatsApp + WhatsApp button), NEXT_PUBLIC_CONTACT_PHONE (Call button),
NEXT_PUBLIC_BUSINESS_HOURS (text; hidden when empty), OWNER_MOBILE / OWNER_PIN (seed script only).
Local: `.env.local` (git-ignored). Vercel: production env vars (NEXT_PUBLIC_* are build-time — redeploy after changing).

## Operations
- Windows/PowerShell: use `npm.cmd` / `npx.cmd`. OneDrive can lock `.next` (EPERM on build) → delete `.next` and rebuild; stop the dev server before building.
- Migrations: `npx drizzle-kit generate --name <x>`, then `npx drizzle-kit migrate` (runs against the live DB). Column renames make `generate` prompt interactively → write a `--custom` migration by hand and replace its `meta/NNNN_snapshot.json` with a fresh snapshot of the current schema (keep `id`/`prevId`); a follow-up `generate` must say "No schema changes".
- Order matters: run additive migrations before deploying code that reads the new columns; for renames, migrate and deploy back to back.
- Deploy: `npx vercel deploy --prod --yes` (CLI sometimes returns "Not authorized" — just retry). Then `git push`.
- SQL pitfalls: (1) Drizzle drops table prefixes from columns inside selected `sql\`\`` fields of single-table queries → write correlated subqueries as raw SQL with explicit aliases (see lib/stock.ts). (2) In Postgres regex use `[[:space:]]`, not `\s` (escaping breaks across JS→SQL).
- Before risky data/SQL changes, dry-run inside `BEGIN … ROLLBACK` with a temporary `scripts/_check*.ts` (`npx tsx --conditions=react-server …`), then delete the script. Never insert test orders without explicit order_no (sequence gaps).

## Roles & pricing (CRITICAL)
- guest: no account, RETAIL price. owner sees retail on the public site.
- retailer: created by owner only; mobile + PIN; sees WHOLESALE price. Login → /products.
- owner: full admin (/admin/*), may also open /staff/*. Login → /admin/orders. No cart.
- employee: created by owner (Admin → Employees); may use ONLY /staff/* (proxy.ts redirects everything else); login → /staff/orders; never receives customer mobile numbers (not selected server-side). No cart.
- ERP Sales Price = WHOLESALE rate (`products.wholesale_price`). Retail = wholesale × 2 (`RETAIL_MULTIPLIER`, `priceFor()` in lib/pricing.ts). No rounding (rates/amounts numeric(12,3)); display ₹ with paise, Indian formatting.
- Price is decided on the server from the session. Browser product data has ONE `price` field; never send wholesale to a guest. Admin products shows Wholesale and Retail (×2).
- Packing charge: wholesale orders only, 1% of items subtotal (`PACKING_CHARGE_RATE`, `packingChargeFor()`), stored in orders.packing_charge; orders.total = items + packing charge. Shown as "Packing charges (1%)" in cart, checkout, order-placed, WhatsApp, my-orders, admin, staff.
- Checkout ignores client prices and recalculates every line. Existing orders keep their snapshot rates. No GST, no MOQ, qty = positive integer.
- Mobiles: India only; users type 10 digits (`^[6-9]\d{9}$`), stored as 10 digits, "+91" fixed prefix in inputs, WhatsApp links use `91` + number.

## Database (lib/db/schema.ts)
- users: id, mobile (unique), name, shop_name, city, pin_hash, role ('owner'|'retailer'|'employee'), is_active, failed_attempts, locked_until, created_at
- categories: id, name, slug (unique), sort_order, is_active, created_at
- products: id, barcode (unique, THE PRODUCT KEY), code (ERP code, not unique), erp_name, display_name (null), description (null), unit, wholesale_price (numeric 10,2), stock_qty, in_stock, category_id (null), is_visible, last_received, updated_at
- product_images: id, barcode (fk), public_id, format (null; 'gif' → still frame in lists), is_primary, sort_order, created_at
- orders: id, order_no (sequence from 1001, shown `TN-1001`), user_id (null = guest), customer_name, shop_name (null), mobile, city, price_type ('retail'|'wholesale'), packing_charge, status, total, notes, packed_by, packing_started_at, packed_at, dispatched_at, confirmed_at (legacy, unused), created_at, updated_at
- order_items: id, order_id, product_code, barcode (null only for pre-barcode orders), product_name (shown name snapshot), unit, qty, rate, amount, packed (bool), packed_qty (null)
- cart_items: (user_id, barcode) PK, qty, updated_at — retailers' saved carts
- settings: key/value — `last_import_at`
- banners: id, image_public_id, label (null), title (≤ 40), link_text, link_type ('category'|'product'|'search'), link_value (slug / barcode / search text), color ('orange'|'pink'|'teal'|'purple'|'amber'), starts_at / ends_at (date null), is_active, sort_order, created_at, updated_at
- Seed (`npm run db:seed`): owner from OWNER_MOBILE/OWNER_PIN. Migrations 0000–0011 in /drizzle.

## ERP stock import (/admin/import, app/api/admin/import, lib/erp-import.ts)
- .xlsx, first sheet; skip first 4 rows; columns by position (0-based): 0 Code, 1 Product Name, 2 Unit, 3 Current Stock, 12 Sales Price, 15 Rec.Date (`06-Sep-26`), 23 Barcode. Never store any other column.
- Skip rows with empty Barcode/Code or Sales Price ≤ 0. Group by Barcode: stock_qty = SUM(stock); code/erp_name/unit/wholesale_price/last_received from the latest Rec.Date row (tie → last).
- Upsert by barcode updating ONLY code, erp_name, unit, wholesale_price, stock_qty, in_stock (= stock_qty > 0), last_received. Never touch category, visibility, images, display_name, description. New barcodes inherit the category of an existing product with the same code.
- Barcodes in DB but not in the file → stock_qty = 0 AND in_stock = false (an old qty must never count as available).
- Summary: new / updated / "Set to zero (not in file): n" (barcodes on expand) / skipped. Sets settings.last_import_at; revalidates the site.

## Stock (lib/stock.ts) — reserved at order PLACEMENT, computed, nothing stored
- reserved = Σ qty over orders 'new' | 'packing' | 'packed', plus 'dispatched' with dispatched_at > last_import_at; 'packed'/'dispatched' count COALESCE(packed_qty, qty). Cancelled never counts (cancel = released).
- available = 0 if in_stock is false, else max(0, floor(stock_qty − reserved)).
- Public site shows only is_visible products with available > 0 in active (or no) categories. Admin products lists all with Stock / Reserved / Available.
- Checkout (app/(site)/checkout/actions.ts): ONE transaction — lock product rows FOR UPDATE (barcode order), recompute available, reject per item "Only X available", else insert order + items. Staff/owner accounts can't order.
- revalidatePath('/', 'layout') after order placement, every status change and every import.

## Product names (lib/productName.ts)
- cleanName(erp_name): "T" + 3-letter word → drop both; "BAH DBT" → drop both; else a single-letter first word → drop it; never empty. Shown name = display_name ?? cleanName(erp_name), everywhere incl. order snapshots and WhatsApp. `shownNameSql` (lib/catalog.ts) mirrors it for sorting.
- Search (display_name, erp_name, code, barcode) is search-as-you-type (components/LiveSearch.tsx, 300 ms) on /products and Admin → Products; home search submits to /products?q=.

## Catalogue (lib/catalog.ts)
- ONE query builder `queryPublicProducts()` for home, /products, search, product page, cart and checkout; returns `available` as a number and one `price`.
- Product card: image (GIF → first frame), name (2 lines), barcode, unit, "Stock: n", price, QtyStepper (Add / − qty + capped at available; "Max n available"; "Out of stock" at 0).
- Product page: gallery (GIFs animate), description, stock, large QtyStepper. Cart page: "You may also like" row (same categories, fallback newest; excludes cart items).

## Cart (lib/cart.ts, components/CartProvider.tsx — one context for header link, mobile bar, steppers, cart, checkout)
- Guest: localStorage `tn_cart_guest` (old key `tn_cart` removed on load). Retailer: cart_items via server actions in app/(site)/cart/actions.ts (user from session only), every write capped at available; first page after login merges the guest cart (add, cap) then clears it. Owner/employee: no cart UI.
- Logout (components/LogoutButton.tsx) clears the in-memory cart and `tn_cart_guest` before signing out. Placing an order deletes the retailer's cart_items / clears the guest cart.
- Cart page clamps stored qtys to current stock on load (notes reductions/removals). Header link and mobile sticky bar (<768px, not on /cart or /checkout) show item count only. Cart/checkout show Items, Packing charges (wholesale), "Estimated total" + "Final bill after packing".

## Orders, statuses & packing
- Flow: new → packing → packed → dispatched, plus cancelled (lib/order-statuses.ts; retailers see 'packing' as "Being packed"). No confirmation step.
- Staff (/staff/orders tabs To pack / Packing / Packed / All; /staff/orders/[id]; actions lock the order row FOR UPDATE): "Start packing" only on 'new' (sets packing, packed_by, packing_started_at; someone else's → "Being packed by {name}", blocked; only packed_by edits). Each tick saves instantly; "Short" sets packed_qty 0..qty. "Finish packing" only when all rows are done → packed_qty = qty for ticked rows, status 'packed', packed_at.
- Owner (admin order detail): only cancel (new/packing/packed) or packed → dispatched (after ERP billing; sets dispatched_at), plus notes. Shows packed by/at, short items in amber, packed total; "Stock released" on cancel. An order stuck in 'packing' can only be cancelled.
- Order-placed page (visible to the placing browser via signed cookie, the owning retailer, or owner): WhatsApp button to NEXT_PUBLIC_OWNER_WHATSAPP with the summary. Shop name optional at checkout (NULL when empty; lines skipped when empty).

## Admin (/admin, owner)
Orders (filter by status, search order no/mobile/shop/name, packed by/at) · Banners (see above) · Products (search, filters uncategorised/no image/out of stock, bulk category, visibility, display name/description editor, Cloudinary images: multiple, primary, delete also from Cloudinary; formats jpg/jpeg/png/webp/gif ≤ 10 MB) · Import · Categories (add/rename/reorder/activate) · Retailers · Employees (add/edit/reset PIN/activate) · Packing link → /staff/orders.

## Design
- Playful-but-clean toy brand, white background, mobile-first. Fonts: Fredoka (headings), Inter (body). Palette tokens: brand #5B3FA0 (dark #3D2C6E), tn-orange #F07A2E, tn-pink #E8488A, tn-teal #2BB5BE, tn-yellow #F5C518.
- Logos: `/logo-tn-mark.png` (36px tall) directly on purple in the site header and footer + "Toy Nation" text. `/logo-transparent.png` is currently unused. `/logo.png` (signboard photo) only inside LogoTile on the login card and admin/staff headers — never bare on white.
- Site header: logo + name left; pill search (translucent white, submits to /products?q=) centred on md+ (max 360px), its own full-width row below the bar on mobile; nav right. Retailer header: Products, Cart, "My orders" pill; greeting strip with Logout.
- Home (app/(site)/page.tsx, force-dynamic), in order:
  1. Hero (purple): lg+ two columns — left headline "Toys & seasonal goods, wholesale", subtext with {count}+, "Browse products" (yellow) + "Retailer login" (outline, only when logged out); right BannerSlider. Mobile: text then slider. Staggered slide-up entrance + floating confetti dots (`.tn-rise` / `.tn-float` in globals.css, off for prefers-reduced-motion).
  2. Selling points band (white, bottom border; 4 in a row / 2×2 mobile): Home delivery, Wholesale rates, Live stock, {count}+ products. These appear only here.
  3. Shop by category (tinted) → 4. New arrivals (white) → 5. Visit our store (tinted; address, hours, Call / WhatsApp / Directions; `-mb-16` so the tint meets the footer) → footer.
  - {count} = `countPublicProducts()` (same filter as the public list), `productCountLabel()` rounds down to the hundred ("1,200+"; exact below 100).

## Banners (lib/banner-presets.ts, lib/banners.ts, app/admin/banners, components/BannerCard.tsx + BannerSlider.tsx)
- Public slider shows banners with is_active and today (Asia/Kolkata, `todayIST()`) within starts_at..ends_at (nulls open), by sort_order. Card: 12:7 photo, label in preset colour, title, link text + arrow; whole card links to `bannerHref()` (category → /products?category=slug, product → /products/{barcode}, search → /products?q=).
- 2+: auto-rotate 3.5 s, slide transition, dots, swipe, pause on hover; all slides rendered in one row (equal height). 1: static. 0: default "Browse {count}+ products" card → /products.
- Admin → Banners: list (thumbnail, title, status Live / Scheduled / Off / Expired via `bannerStatus()`, dates, ▲▼ reorder, active switch, edit, delete — also deletes the photo from Cloudinary). /admin/banners/new and /admin/banners/[id]: upload (required), label, title, link text, link type + value (category dropdown / barcode with lookup / search text), colour presets, Show from / until, active; live preview. A replaced photo is deleted from Cloudinary; unsaved uploads are discarded on replace/cancel.
- Every banner write revalidates / and /admin/banners.

## Pages
Public: `/` · `/products` · `/products/[barcode]` · `/cart` · `/checkout` · `/order-placed/[orderNo]` · `/login`
Retailer: `/my-orders` · `/my-orders/[orderNo]`
Owner: `/admin/{orders,orders/[id],products,import,categories,banners,banners/new,banners/[id],retailers,employees}`
Staff (employee or owner): `/staff/orders` · `/staff/orders/[id]`

@AGENTS.md
