CREATE TYPE "public"."document_status" AS ENUM('active', 'revoked');--> statement-breakpoint
CREATE TABLE "documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"number" text NOT NULL,
	"title" text NOT NULL,
	"signatory" text NOT NULL,
	"issued_at" timestamp NOT NULL,
	"file_url" text,
	"status" "document_status" DEFAULT 'active',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "documents_slug_unique" UNIQUE("slug")
);
