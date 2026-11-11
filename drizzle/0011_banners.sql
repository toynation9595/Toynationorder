CREATE TABLE "banners" (
	"id" serial PRIMARY KEY NOT NULL,
	"image_public_id" text NOT NULL,
	"label" text,
	"title" text NOT NULL,
	"link_text" text DEFAULT '' NOT NULL,
	"link_type" text NOT NULL,
	"link_value" text NOT NULL,
	"color" text DEFAULT 'purple' NOT NULL,
	"starts_at" date,
	"ends_at" date,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
