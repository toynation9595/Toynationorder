ALTER TABLE "order_items" ADD COLUMN "packed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "packed_qty" integer;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "packed_by" integer;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "packing_started_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "packed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_packed_by_users_id_fk" FOREIGN KEY ("packed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
-- No confirmation step any more: existing confirmed orders go back to new (they still reserve stock).
UPDATE "orders" SET "status" = 'new' WHERE "status" = 'confirmed';
