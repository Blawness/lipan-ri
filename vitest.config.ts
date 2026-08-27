import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    // Unit test saja. Berkas e2e/ dipegang Playwright dan akan bentrok
    // kalau ikut terjaring (keduanya mengekspor `test`).
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
});
