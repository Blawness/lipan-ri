import { db } from "@/db";
import { signatories } from "@/db/schema";
import { asc } from "drizzle-orm";

export async function getSignatories() {
  return db.select().from(signatories).orderBy(asc(signatories.name));
}
