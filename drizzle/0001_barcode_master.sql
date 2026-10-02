-- Switch the product master from ERP Code to Barcode.
-- Old code-keyed product rows are deleted; the next ERP import recreates products by barcode,
-- and new barcodes inherit the category of an existing product with the same code.
-- Guard: no category assignments may be lost (there were none when this was written).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "products" WHERE "category_id" IS NOT NULL) THEN
    RAISE EXCEPTION 'products have categories assigned; carry them over before running this migration';
  END IF;
END $$;--> statement-breakpoint
ALTER TABLE "product_images" DROP CONSTRAINT "product_images_product_code_products_code_fk";--> statement-breakpoint
DROP INDEX "product_images_code_idx";--> statement-breakpoint
DELETE FROM "product_images";--> statement-breakpoint
ALTER TABLE "product_images" DROP COLUMN "product_code";--> statement-breakpoint
DELETE FROM "products";--> statement-breakpoint
ALTER TABLE "products" DROP CONSTRAINT "products_code_unique";--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "barcode" text NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_barcode_unique" UNIQUE("barcode");--> statement-breakpoint
CREATE INDEX "products_code_idx" ON "products" USING btree ("code");--> statement-breakpoint
ALTER TABLE "product_images" ADD COLUMN "barcode" text NOT NULL;--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_barcode_products_barcode_fk" FOREIGN KEY ("barcode") REFERENCES "public"."products"("barcode") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "product_images_barcode_idx" ON "product_images" USING btree ("barcode");--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "barcode" text;
