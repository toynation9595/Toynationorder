ALTER TABLE "orders" ALTER COLUMN "shop_name" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "shop_name" DROP NOT NULL;--> statement-breakpoint
UPDATE "orders" SET "shop_name" = NULL WHERE btrim("shop_name") = '';
