import { config } from "dotenv";
// Load .env.local first (Next.js convention, where AUTH_SECRET/ADMIN_*/DATABASE_URL
// live), then fall back to .env without overriding values already set.
config({ path: ".env.local" });
config();
import { hash } from "bcryptjs";
import { db } from "../src/db";
import { users } from "../src/db/schema";

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME ?? "Admin LIPAN RI";

  if (!email || !password) {
    throw new Error("ADMIN_EMAIL dan ADMIN_PASSWORD wajib di-set di env.");
  }

  const passwordHash = await hash(password, 12);

  await db
    .insert(users)
    .values({ email, name, passwordHash, role: "admin" })
    .onConflictDoUpdate({
      target: users.email,
      set: { passwordHash, name, role: "admin" },
    });

  console.log(`✅ Admin siap: ${email} (role: admin)`);
  process.exit(0);
}

main().catch((e) => {
  console.error("❌ Gagal membuat admin:", e);
  process.exit(1);
});
