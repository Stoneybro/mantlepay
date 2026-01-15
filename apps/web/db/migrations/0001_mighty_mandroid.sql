CREATE TABLE "contact_addresses" (
	"id" text PRIMARY KEY NOT NULL,
	"contact_id" text NOT NULL,
	"address" text NOT NULL,
	"label" text,
	"entity_id" text,
	"jurisdiction" text,
	"category" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contact_addresses" ADD CONSTRAINT "contact_addresses_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;