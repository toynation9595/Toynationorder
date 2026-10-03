ALTER TABLE "products" RENAME COLUMN "name" TO "erp_name";--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "display_name" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "description" text;
