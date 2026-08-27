CREATE TYPE "public"."pengurus_status" AS ENUM('aktif', 'nonaktif');--> statement-breakpoint
CREATE TABLE "pengurus" (
	"id" serial PRIMARY KEY NOT NULL,
	"slot" text,
	"slug" text NOT NULL,
	"nomor_anggota" text NOT NULL,
	"nama" text NOT NULL,
	"jabatan" text NOT NULL,
	"foto" text,
	"deskripsi" text,
	"email" text,
	"telepon" text,
	"status" "pengurus_status" DEFAULT 'aktif',
	"mulai_menjabat" timestamp NOT NULL,
	"selesai_menjabat" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "pengurus_slot_unique" UNIQUE("slot"),
	CONSTRAINT "pengurus_slug_unique" UNIQUE("slug"),
	CONSTRAINT "pengurus_nomor_anggota_unique" UNIQUE("nomor_anggota")
);
