import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  boolean,
  pgEnum,
  jsonb,
  unique,
} from "drizzle-orm/pg-core";
import {
  users,
  media,
  loginAttempts,
  auditLogs,
} from "@blawness/admin-kit/schema";

// Re-export admin-kit-owned tables so drizzle-kit sees the complete schema
// (otherwise tables nothing in this file references — e.g. `media`,
// `login_attempts` (login rate limiter), `audit_logs` (admin action log) —
// are invisible to migrations and would never be created / get dropped).
export { users, media, loginAttempts, auditLogs };

export const postStatusEnum = pgEnum("post_status", ["draft", "published"]);
export const documentStatusEnum = pgEnum("document_status", ["active", "revoked"]);

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  parentId: integer("parent_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  featuredImage: text("featured_image"),
  categoryId: integer("category_id").references(() => categories.id),
  authorId: integer("author_id").references(() => users.id),
  isFeatured: boolean("is_featured").default(false),
  status: postStatusEnum("status").default("draft"),
  publishedAt: timestamp("published_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const pages = pgTable("pages", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  metaDescription: text("meta_description"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const banners = pgTable("banners", {
  id: serial("id").primaryKey(),
  imageUrl: text("image_url").notNull(),
  title: text("title"),
  subtitle: text("subtitle"),
  buttonText: text("button_text"),
  buttonLink: text("button_link"),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  number: text("number").notNull(),
  title: text("title").notNull(),
  signatory: text("signatory").notNull(),
  issuedAt: timestamp("issued_at").notNull(),
  fileUrl: text("file_url"),
  status: documentStatusEnum("status").default("active"),
  viewCount: integer("view_count").default(0),
  revokeReason: text("revoke_reason"),
  showDocument: boolean("show_document").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const signatories = pgTable("signatories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  // `title` adalah GELAR ("SE, SH, MH") — bukan jabatan. Jangan tertukar.
  title: text("title"),
  // Jabatan yang tercetak di blok tanda tangan PDF ("Ketua Umum").
  position: text("position"),
  // Akun yang berhak mengesahkan surat atas nama penandatangan ini.
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const documentLogActionEnum = pgEnum("document_log_action", [
  "created",
  "updated",
  "revoked",
]);

export const documentLogs = pgTable("document_logs", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id")
    .notNull()
    .references(() => documents.id, { onDelete: "cascade" }),
  actorId: integer("actor_id").notNull(),
  action: documentLogActionEnum("action").notNull(),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const pengurusStatusEnum = pgEnum("pengurus_status", ["aktif", "nonaktif"]);

export const pengurus = pgTable("pengurus", {
  id: serial("id").primaryKey(),
  // id slot di org-flow.ts. Nullable: baris tanpa slot (mis. perwakilan daerah)
  // sah ada, cuma tidak punya kotak di bagan.
  slot: text("slot").unique(),
  slug: text("slug").notNull().unique(),
  nomorAnggota: text("nomor_anggota").notNull().unique(),
  nama: text("nama").notNull(),
  jabatan: text("jabatan").notNull(),
  foto: text("foto"),
  deskripsi: text("deskripsi"),
  // email & telepon hanya tampil di panel bagan, TIDAK di halaman verifikasi.
  email: text("email"),
  telepon: text("telepon"),
  status: pengurusStatusEnum("status").default("aktif"),
  mulaiMenjabat: timestamp("mulai_menjabat").notNull(),
  selesaiMenjabat: timestamp("selesai_menjabat"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const letterStatusEnum = pgEnum("letter_status", [
  "draft",
  "submitted",
  "issued",
]);

export const letterLogActionEnum = pgEnum("letter_log_action", [
  "created",
  "updated",
  "submitted",
  "rejected",
  "issued",
  // Pembuat surat membatalkan pengajuannya sendiri. Sengaja dibedakan dari
  // "rejected": jejaknya harus jujur soal siapa yang mengembalikan ke draft.
  "withdrawn",
]);

/** Satu field tambahan yang diisi saat membuat surat dari template ini. */
export type LetterTemplateField = {
  key: string;
  label: string;
  type: "text" | "textarea" | "date" | "number";
  required: boolean;
};

export const letterTemplates = pgTable("letter_templates", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  // Token yang dikenali: {seq} {tahun} {bulan} {bulanRomawi} {kode}
  numberPattern: text("number_pattern").notNull(),
  // HTML tersanitasi (sanitizeSuratHtml), bukan Tiptap JSON.
  bodyDefault: text("body_default").notNull().default(""),
  fields: jsonb("fields").$type<LetterTemplateField[]>().notNull().default([]),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const letters = pgTable(
  "letters",
  {
    id: serial("id").primaryKey(),
    templateId: integer("template_id")
      .notNull()
      .references(() => letterTemplates.id, { onDelete: "restrict" }),
    subject: text("subject").notNull(),
    bodyHtml: text("body_html").notNull().default(""),
    fieldValues: jsonb("field_values")
      .$type<Record<string, string>>()
      .notNull()
      .default({}),
    signatoryId: integer("signatory_id")
      .notNull()
      .references(() => signatories.id, { onDelete: "restrict" }),
    status: letterStatusEnum("status").notNull().default("draft"),
    // Ketiganya null selama surat belum disahkan.
    numberSeq: integer("number_seq"),
    numberYear: integer("number_year"),
    number: text("number"),
    documentId: integer("document_id").references(() => documents.id, {
      onDelete: "set null",
    }),
    rejectionNote: text("rejection_note"),
    createdBy: integer("created_by").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => [
    // Inilah yang mencegah dua pengesahan bersamaan merebut nomor yang sama.
    unique("letters_seq_unique").on(t.templateId, t.numberYear, t.numberSeq),
  ]
);

export const letterLogs = pgTable("letter_logs", {
  id: serial("id").primaryKey(),
  letterId: integer("letter_id")
    .notNull()
    .references(() => letters.id, { onDelete: "cascade" }),
  actorId: integer("actor_id").notNull(),
  action: letterLogActionEnum("action").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow(),
});
