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
- guest: no account, sees RETAIL price.
- retailer: created by owner only (no self-registration). Logs in with mobile + PIN. Active retailer sees WHOLESALE price.
- owner: full admin.
- Retail price = `products.retail_price` (from ERP Sales Price).
- Wholesale price = retail_price × 0.5 (constant `WHOLESALE_DISCOUNT = 0.5` in `lib/pricing.ts`). NO rounding: keep the exact value (store rates/amounts as numeric(12,3)); display with paise, e.g. ₹42.50.
- Price is decided ON THE SERVER from the session. Product data sent to the browser contains ONE field `price` only. Never send both prices or the retail_price to a retailer view or wholesale price to a guest.
- On order submit, server ignores client prices and recalculates every line.
- No GST anywhere. No MOQ. Quantity = any positive integer.
- Mobile numbers: India only, default +91. Users type 10 digits (validate `^[6-9]\d{9}$`), store 10 digits, show "+91" as a fixed prefix in inputs. WhatsApp links use `91` + number.

## Database (Drizzle schema)
- users: id, mobile (unique, text), name, shop_name, city, pin_hash, role ('owner'|'retailer'), is_active (bool, default true), failed_attempts (int), locked_until (timestamp null), created_at
- categories: id, name, slug (unique), sort_order, is_active, created_at
- products: id, code (unique, TEXT – the ERP product Code), name, unit (text, as in ERP), retail_price (numeric 10,2), stock_qty (numeric), in_stock (bool), category_id (null), is_visible (bool default true), last_received (date null), updated_at
- product_images: id, product_code (fk products.code), public_id, is_primary (bool), sort_order, created_at
- orders: id, order_no (int unique, sequence starting 1001; display as `TN-1001`), user_id (null for guest), customer_name, shop_name, mobile, city, price_type ('retail'|'wholesale'), status ('new'|'confirmed'|'packed'|'dispatched'|'cancelled', default 'new'), total (numeric), notes (text null), created_at, updated_at
- order_items: id, order_id, product_code, product_name, unit, qty (int), rate (numeric), amount (numeric) — snapshot values at order time

Seed script: creates owner user from OWNER_MOBILE/OWNER_PIN.

## ERP stock import (owner only)
Source: stock report .xlsx from the ERP (single sheet).
- Skip the first 4 rows (company name, report date, 2-row header). Read columns BY POSITION (0-based):
  0 Code, 1 Product Name, 2 Unit, 3 Current Stock, 12 Sales Price, 15 Rec.Date (format `06-Sep-26`)
- Ignore every other column (cost, purchase price, supplier, barcode, etc.) — never store them.
- Skip rows where Code is empty or Sales Price <= 0.
- One product has many rows (batches). Group by Code:
  - stock_qty = SUM of Current Stock (can be negative)
  - in_stock = stock_qty > 0
  - name, unit, retail_price, last_received = from the row with the LATEST Rec.Date (tie → last row)
- Upsert by code: update name, unit, retail_price, stock_qty, in_stock, last_received ONLY. Never touch category_id, is_visible, or images.
- Products in DB but not in the file → in_stock = false.
- Show result summary: new / updated / marked out of stock / skipped rows.

## Design
- Professional, playful-but-clean toy brand. White dominant background.
- Logo: `/public/logo.png` is a PHOTO of the signboard (purple background, white confetti "TN" + "Toy Nation"). Use it as-is inside a rounded tile in the header and hero; do not place it on white without the tile.
- Palette (Tailwind theme tokens): primary purple #5B3FA0 (dark #3D2C6E), confetti accents orange #F07A2E, pink #E8488A, teal #2BB5BE, yellow #F5C518. Purple for header, buttons and hero; accents sparingly for badges, category tiles and small confetti dots.
- Fonts via next/font: Fredoka (headings), Inter (body).
- Rounded cards, soft shadows, generous spacing. Mobile-first (most users order on phones); works well on desktop too.
- Product card: image (placeholder if none), name, unit, price, "Out of stock" badge (add button disabled when out of stock).
- Prices shown as ₹ with Indian number formatting.

## Pages
Public: `/` (hero with logo, About Toy Nation, category tiles, a few products) · `/products` (grid, category filter, search by name/code) · `/products/[code]` (image gallery, details, qty, add to cart) · `/cart` · `/checkout` · `/order-placed/[orderNo]` · `/login`
Retailer: `/my-orders` · `/my-orders/[orderNo]`
Owner (`/admin/*`, role-guarded in middleware): orders · order detail · products · import · categories · retailers

## Build plan

### Day 1 – Foundation + catalogue
1. Project setup, Tailwind, fonts, Drizzle schema + migration, seed owner.
2. Auth: `/login` (mobile + PIN), session cookie, lock account for 15 min after 5 wrong PINs, logout, middleware guarding `/admin` and `/my-orders`. Login redirects owner → /admin/orders, retailer → /products.
3. Admin layout + `/admin/import` (ERP import as specified above).
4. `/admin/categories` (add / rename / reorder / activate).
5. `/admin/products`: list with search, filter (uncategorised / no image / out of stock), multi-select → bulk assign category, visibility toggle, image upload per product via Cloudinary widget (multiple images, set primary, delete — also delete from Cloudinary).
6. Public `/`, `/products`, `/products/[code]` with server-side pricing. Only show products where is_visible = true; only active categories.

### Day 2 – Ordering + accounts
1. Cart in localStorage (stores product code + qty only). Cart page fetches current prices from server.
2. `/checkout`: guest enters name, shop name, mobile (10 digits), city; logged-in retailer sees their details prefilled. Server recalculates prices, creates order + items, clears cart.
3. `/order-placed/[orderNo]`: confirmation + "Send on WhatsApp" button → `https://wa.me/<NEXT_PUBLIC_OWNER_WHATSAPP>?text=<encoded order summary>` (order no, customer, shop, city, mobile, items × qty × rate, total).
4. `/admin/orders`: list newest first, filter by status, search by order no / mobile / shop. `/admin/orders/[id]`: full detail, status dropdown, notes, link to call/WhatsApp the customer.
5. `/admin/retailers`: add retailer (mobile, name, shop, city, PIN), edit, reset PIN, activate/deactivate.
6. `/my-orders` + `/my-orders/[orderNo]` for logged-in retailers: list (date, order no, items, total, status) and read-only detail. Retailers can only see their own orders.

@AGENTS.md
