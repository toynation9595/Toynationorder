CREATE TABLE "cart_items" (
	"user_id" integer NOT NULL,
	"barcode" text NOT NULL,
	"qty" integer NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cart_items_user_id_barcode_pk" PRIMARY KEY("user_id","barcode")
);
--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_barcode_products_barcode_fk" FOREIGN KEY ("barcode") REFERENCES "public"."products"("barcode") ON DELETE cascade ON UPDATE cascade;