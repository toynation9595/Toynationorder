import {
  pgTable,
  pgSequence,
  serial,
  integer,
  text,
  boolean,
  timestamp,
  numeric,
  date,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const orderNoSeq = pgSequence("order_no_seq", { startWith: 1001 });

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  mobile: text("mobile").notNull().unique(),
  name: text("name").notNull(),
  shopName: text("shop_name").notNull().default(""),
  city: text("city").notNull().default(""),
  pinHash: text("pin_hash").notNull(),
  role: text("role", { enum: ["owner", "retailer"] }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  failedAttempts: integer("failed_attempts").notNull().default(0),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    barcode: text("barcode").notNull().unique(),
    code: text("code").notNull(),
    erpName: text("erp_name").notNull(), // from the ERP import
    displayName: text("display_name"), // owner override; import never touches it
    description: text("description"), // owner-written; import never touches it
    unit: text("unit").notNull().default(""),
    retailPrice: numeric("retail_price", { precision: 10, scale: 2 }).notNull(),
    stockQty: numeric("stock_qty", { precision: 12, scale: 3 }).notNull().default("0"),
    inStock: boolean("in_stock").notNull().default(false),
    categoryId: integer("category_id").references(() => categories.id, { onDelete: "set null" }),
    isVisible: boolean("is_visible").notNull().default(true),
    lastReceived: date("last_received"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("products_category_idx").on(t.categoryId), index("products_code_idx").on(t.code)]
);

export const productImages = pgTable(
  "product_images",
  {
    id: serial("id").primaryKey(),
    barcode: text("barcode")
      .notNull()
      .references(() => products.barcode, { onDelete: "cascade", onUpdate: "cascade" }),
    publicId: text("public_id").notNull(),
    isPrimary: boolean("is_primary").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("product_images_barcode_idx").on(t.barcode)]
);

export const orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    orderNo: integer("order_no")
      .notNull()
      .unique()
      .default(sql`nextval('order_no_seq')`),
    userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
    customerName: text("customer_name").notNull(),
    shopName: text("shop_name"), // optional for guests; NULL when not given
    mobile: text("mobile").notNull(),
    city: text("city").notNull().default(""),
    priceType: text("price_type", { enum: ["retail", "wholesale"] }).notNull(),
    status: text("status", {
      enum: ["new", "confirmed", "packed", "dispatched", "cancelled"],
    })
      .notNull()
      .default("new"),
    total: numeric("total", { precision: 12, scale: 3 }).notNull(),
    notes: text("notes"),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    dispatchedAt: timestamp("dispatched_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("orders_user_idx").on(t.userId), index("orders_mobile_idx").on(t.mobile)]
);

export const orderItems = pgTable(
  "order_items",
  {
    id: serial("id").primaryKey(),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productCode: text("product_code").notNull(),
    barcode: text("barcode"), // null only for orders placed before the barcode switch
    productName: text("product_name").notNull(),
    unit: text("unit").notNull().default(""),
    qty: integer("qty").notNull(),
    rate: numeric("rate", { precision: 12, scale: 3 }).notNull(),
    amount: numeric("amount", { precision: 12, scale: 3 }).notNull(),
  },
  (t) => [index("order_items_order_idx").on(t.orderId), index("order_items_barcode_idx").on(t.barcode)]
);

/** Key/value app settings, e.g. last_import_at (ISO timestamp of the last successful ERP import). */
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export { ORDER_STATUSES, type OrderStatus } from "../order-statuses";
