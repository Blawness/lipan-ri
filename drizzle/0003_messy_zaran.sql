CREATE TYPE "public"."letter_log_action" AS ENUM('created', 'updated', 'submitted', 'rejected', 'issued');--> statement-breakpoint
CREATE TYPE "public"."letter_status" AS ENUM('draft', 'submitted', 'issued');--> statement-breakpoint
CREATE TABLE "letter_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"letter_id" integer NOT NULL,
	"actor_id" integer NOT NULL,
	"action" "letter_log_action" NOT NULL,
	"note" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "letter_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"number_pattern" text NOT NULL,
	"body_default" text DEFAULT '' NOT NULL,
	"fields" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "letter_templates_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "letters" (
	"id" serial PRIMARY KEY NOT NULL,
	"template_id" integer NOT NULL,
	"subject" text NOT NULL,
	"body_html" text DEFAULT '' NOT NULL,
	"field_values" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"signatory_id" integer NOT NULL,
	"status" "letter_status" DEFAULT 'draft' NOT NULL,
	"number_seq" integer,
	"number_year" integer,
	"number" text,
	"document_id" integer,
	"rejection_note" text,
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "letters_seq_unique" UNIQUE("template_id","number_year","number_seq")
);
--> statement-breakpoint
ALTER TABLE "signatories" ADD COLUMN "position" text;--> statement-breakpoint
ALTER TABLE "signatories" ADD COLUMN "user_id" integer;--> statement-breakpoint
ALTER TABLE "letter_logs" ADD CONSTRAINT "letter_logs_letter_id_letters_id_fk" FOREIGN KEY ("letter_id") REFERENCES "public"."letters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "letters" ADD CONSTRAINT "letters_template_id_letter_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."letter_templates"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "letters" ADD CONSTRAINT "letters_signatory_id_signatories_id_fk" FOREIGN KEY ("signatory_id") REFERENCES "public"."signatories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "letters" ADD CONSTRAINT "letters_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signatories" ADD CONSTRAINT "signatories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;