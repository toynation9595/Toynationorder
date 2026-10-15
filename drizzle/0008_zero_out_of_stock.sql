-- One-time data fix: products marked out of stock (not in the last ERP file) kept their old stock_qty,
-- which still counted as available. Zero them.
UPDATE "products" SET "stock_qty" = 0, "updated_at" = now() WHERE "in_stock" = false AND "stock_qty" > 0;
