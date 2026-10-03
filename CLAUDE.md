# Toy Nation – Wholesale Catalogue & Order Portal

Brand website + order management for Toy Nation (toys & seasonal wholesale, Nashik).
Address (footer/About): Rajneel Square, Near Indian Oil Pump, Mumbai-Agra Service Road, Ojhar (MIG), Nashik, Maharashtra 422207.

## Working rules (token budget)
- Build only what is in scope below. No extra features, no refactors, no placeholders for future phases.
- NO tests, no test frameworks, no test files. After each step run `npm run build` only; fix errors and move on.
- Keep explanations short. No long summaries after each step.

## Stack
- Next.js (latest stable, App Router, TypeScript, Server Components + Server Actions/Route Handlers)
- Tailwind CSS
- Neon Postgres via `@neondatabase/serverless` + Drizzle ORM (drizzle-kit for migrations)
- Auth: custom. bcryptjs for PIN hashing, signed JWT session in httpOnly cookie via `jose` (90-day expiry)
- Images: Cloudinary Upload Widget (signed uploads via our API route); display with Cloudinary URLs (`f_auto,q_auto,w_400` cards, `w_1200` detail). Do NOT use Vercel image optimisation.
- Excel import: SheetJS (`xlsx`) parsed in the browser, rows sent to server as JSON
- Hosting: Vercel (single project)

## Env vars
DATABASE_URL, SESSION_SECRET, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET,
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, NEXT_PUBLIC_OWNER_WHATSAPP (10-digit mobile; app prefixes 91),
OWNER_MOBILE, OWNER_PIN (used only by the seed script)

## Roles & pricing (CRITICAL)
- guest: no account, sees RETAIL price (owner also sees retail on the public site).
- retailer: created by owner only (no self-registration). Logs in with mobile + PIN. Active retailer sees WHOLESALE price.
- owner: full admin.
- The ERP Sales Price is the WHOLESALE rate: Wholesale price = `products.wholesale_price`.
- Retail price = wholesale_price × 2 (constant `RETAIL_MULTIPLIER = 2` in `lib/pricing.ts`, applied by `priceFor()`). NO rounding: keep the exact value (store rates/amounts as numeric(12,3)); display with paise, e.g. ₹42.50.
- Price is decided ON THE SERVER from the session. Product data sent to the browser contains ONE field `price` only. Never send both prices to the browser, and never send the wholesale price to a guest. Admin products shows both (Wholesale and Retail ×2).
- Existing orders/order_items keep the rates they were placed at.
- On order submit, server ignores client prices and recalculates every line.
- No GST anywhere. No MOQ. Quantity = any positive integer.
- Mobile numbers: India only, default +91. Users type 10 digits (validate `^[6-9]\d{9}$`), store 10 digits, show "+91" as a fixed prefix in inputs. WhatsApp links use `91` + number.

## Database (Drizzle schema)
- users: id, mobile (unique, text), name, shop_name, city, pin_hash, role ('owner'|'retailer'), is_active (bool, default true), failed_attempts (int), locked_until (timestamp null), created_at
- categories: id, name, slug (unique), sort_order, is_active, created_at
- products: id, barcode (unique, TEXT – the PRODUCT KEY, from the ERP Barcode column), code (TEXT, ERP product Code, not unique – several barcodes can share a code), erp_name (from import), display_name (text null, owner override), description (text null), unit (text, as in ERP), wholesale_price (numeric 10,2 – ERP Sales Price), stock_qty (numeric), in_stock (bool), category_id (null), is_visible (bool default true), last_received (date null), updated_at
- product_images: id, barcode (fk products.barcode), public_id, is_primary (bool), sort_order, created_at
- orders: id, order_no (int unique, sequence starting 1001; display as `TN-1001`), user_id (null for guest), customer_name, shop_name, mobile, city, price_type ('retail'|'wholesale'), status ('new'|'confirmed'|'packed'|'dispatched'|'cancelled', default 'new'), total (numeric), notes (text null), confirmed_at (timestamp null), dispatched_at (timestamp null), created_at, updated_at
- order_items: id, order_id, product_code, barcode (null only for orders placed before the barcode switch), product_name, unit, qty (int), rate (numeric), amount (numeric) — snapshot values at order time

- settings: key (text pk), value (text), updated_at — holds `last_import_at` (ISO timestamp of the last successful ERP import)

Seed script: creates owner user from OWNER_MOBILE/OWNER_PIN.

## ERP stock import (owner only)
Source: stock report .xlsx from the ERP (single sheet).
- Skip the first 4 rows (company name, report date, 2-row header). Read columns BY POSITION (0-based):
  0 Code, 1 Product Name, 2 Unit, 3 Current Stock, 12 Sales Price, 15 Rec.Date (format `06-Sep-26`), 23 Barcode
- Ignore every other column (cost, purchase price, supplier, barcode, etc.) — never store them.
- Skip rows where Barcode or Code is empty or Sales Price <= 0.
- The product key is the Barcode. One barcode has many rows (batches). Group by Barcode:
  - stock_qty = SUM of Current Stock (can be negative)
  - in_stock = stock_qty > 0
  - code, name, unit, wholesale_price, last_received = from the row with the LATEST Rec.Date (tie → last row)
- Upsert by barcode: update code, erp_name, unit, wholesale_price, stock_qty, in_stock, last_received ONLY. Never touch category_id, is_visible, images, display_name or description.
- New barcodes inherit the category_id of an existing product with the same code, if any.
- Barcodes in DB but not in the file → in_stock = false.
- Show result summary: new / updated / marked out of stock / skipped rows.
- Every successful import sets settings.last_import_at = now().

## Product names (lib/productName.ts)
- cleanName(erp_name): first word "T" + second word of exactly 3 letters → drop both; starts with "BAH DBT" → drop both; else a single-letter first word → drop it. Never empty (falls back to erp_name).
- Shown name = display_name ?? cleanName(erp_name), used everywhere (cards, product page, cart, checkout, order items snapshot, WhatsApp). `shownNameSql` in lib/catalog.ts mirrors it for sorting.
- Search matches display_name, erp_name, code and barcode. Admin products edits display name (Reset to auto clears it) and description; the product page shows the description.

## Stock reservation (lib/stock.ts)
- Nothing is stored; reservation is computed. reserved(barcode) = SUM(order_items.qty) where the order status is 'confirmed' or 'packed', OR status is 'dispatched' and dispatched_at > last_import_at (the ERP stock does not include it yet).
- available = max(0, floor(stock_qty − reserved)). Cancelling an order releases its stock automatically.
- Orders set confirmed_at when they become 'confirmed' and dispatched_at when they become 'dispatched'.
- Public catalogue, category counts and product pages use `available`: products with available = 0 are hidden. Admin products shows them all with Stock / Reserved / Available columns.
- Cart and checkout cap qty at available and show "Only X available". On submit the server locks the product rows and re-checks every line; it rejects with a per-item message if qty > available. A new order does not reserve stock.
- Admin: moving an order into a stock-holding status (confirmed/packed/dispatched from new/cancelled) runs in a DB transaction on the Neon Pool (websocket) driver — never the HTTP driver — that locks the order and the affected product rows (SELECT … FOR UPDATE, in barcode order), re-checks available for every line, and blocks the change listing the short items.

## Design
- Professional, playful-but-clean toy brand. White dominant background.
- Logo: `/public/logo.png` is a PHOTO of the signboard (purple background, white confetti "TN" + "Toy Nation"). Use it as-is inside a rounded tile in the header and hero; do not place it on white without the tile.
- Palette (Tailwind theme tokens): primary purple #5B3FA0 (dark #3D2C6E), confetti accents orange #F07A2E, pink #E8488A, teal #2BB5BE, yellow #F5C518. Purple for header, buttons and hero; accents sparingly for badges, category tiles and small confetti dots.
- Fonts via next/font: Fredoka (headings), Inter (body).
- Rounded cards, soft shadows, generous spacing. Mobile-first (most users order on phones); works well on desktop too.
- Product card: image (placeholder if none), name, barcode (small text under the name), unit, price, "Out of stock" badge (add button disabled when out of stock).
- Prices shown as ₹ with Indian number formatting.

## Pages
Public: `/` (hero with logo, About Toy Nation, category tiles, a few products) · `/products` (grid, category filter, search by name/code/barcode) · `/products/[barcode]` (image gallery, details, qty, add to cart) · `/cart` · `/checkout` · `/order-placed/[orderNo]` · `/login`
Retailer: `/my-orders` · `/my-orders/[orderNo]`
Owner (`/admin/*`, role-guarded in middleware): orders · order detail · products · import · categories · retailers

## Build plan

### Day 1 – Foundation + catalogue
1. Project setup, Tailwind, fonts, Drizzle schema + migration, seed owner.
2. Auth: `/login` (mobile + PIN), session cookie, lock account for 15 min after 5 wrong PINs, logout, middleware guarding `/admin` and `/my-orders`. Login redirects owner → /admin/orders, retailer → /products.
3. Admin layout + `/admin/import` (ERP import as specified above).
4. `/admin/categories` (add / rename / reorder / activate).
5. `/admin/products`: list with search, filter (uncategorised / no image / out of stock), multi-select → bulk assign category, visibility toggle, image upload per product via Cloudinary widget (multiple images, set primary, delete — also delete from Cloudinary).
6. Public `/`, `/products`, `/products/[barcode]` with server-side pricing. Only show products where is_visible = true AND available > 0 (see Stock reservation); only active categories. Admin shows all products.

### Day 2 – Ordering + accounts
1. Cart in localStorage (stores product barcode + qty only; entries without a barcode are ignored). Cart page fetches current prices from server.
2. `/checkout`: guest enters name, shop name, mobile (10 digits), city; logged-in retailer sees their details prefilled. Server recalculates prices, re-checks available stock, creates order + items, clears cart.
3. `/order-placed/[orderNo]`: confirmation + "Send on WhatsApp" button → `https://wa.me/<NEXT_PUBLIC_OWNER_WHATSAPP>?text=<encoded order summary>` (order no, customer, shop, city, mobile, items × qty × rate, total).
4. `/admin/orders`: list newest first, filter by status, search by order no / mobile / shop. `/admin/orders/[id]`: full detail, status dropdown, notes, link to call/WhatsApp the customer.
5. `/admin/retailers`: add retailer (mobile, name, shop, city, PIN), edit, reset PIN, activate/deactivate.
6. `/my-orders` + `/my-orders/[orderNo]` for logged-in retailers: list (date, order no, items, total, status) and read-only detail. Retailers can only see their own orders.

@AGENTS.md
