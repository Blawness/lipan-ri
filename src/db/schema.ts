import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { users, media } from "@blawness/admin-kit/schema";

// Re-export admin-kit-owned tables so drizzle-kit sees the complete schema
// (otherwise `media`, which nothing in this file references, is invisible to
// migrations and a push would propose dropping it).
export { users, media };

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
  title: text("title"),
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
