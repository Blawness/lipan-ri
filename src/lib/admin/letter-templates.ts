import { db } from "@/db";
import { letterTemplates, type LetterTemplateField } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export type TemplateInput = {
  code: string;
  name: string;
  numberPattern: string;
  bodyDefault: string;
  fields: LetterTemplateField[];
  isActive: boolean;
};

const columns = {
  id: letterTemplates.id,
  code: letterTemplates.code,
  name: letterTemplates.name,
  numberPattern: letterTemplates.numberPattern,
  bodyDefault: letterTemplates.bodyDefault,
  fields: letterTemplates.fields,
  isActive: letterTemplates.isActive,
  updatedAt: letterTemplates.updatedAt,
};

export type TemplateRow = {
  id: number;
  code: string;
  name: string;
  numberPattern: string;
  bodyDefault: string;
  fields: LetterTemplateField[];
  isActive: boolean;
  updatedAt: Date | null;
};

export async function listTemplates(): Promise<TemplateRow[]> {
  return db.select(columns).from(letterTemplates).orderBy(asc(letterTemplates.name));
}

export async function listActiveTemplates(): Promise<TemplateRow[]> {
  return db
    .select(columns)
    .from(letterTemplates)
    .where(eq(letterTemplates.isActive, true))
    .orderBy(asc(letterTemplates.name));
}

export async function getTemplateById(id: number): Promise<TemplateRow | null> {
  const [row] = await db.select(columns).from(letterTemplates).where(eq(letterTemplates.id, id)).limit(1);
  return row ?? null;
}

export async function createTemplate(input: TemplateInput): Promise<number> {
  const [row] = await db
    .insert(letterTemplates)
    .values(input)
    .returning({ id: letterTemplates.id });
  return row.id;
}

export async function updateTemplate(id: number, input: TemplateInput): Promise<void> {
  await db
    .update(letterTemplates)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(letterTemplates.id, id));
}
