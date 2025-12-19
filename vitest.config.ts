import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    pool: "forks",
    setupFiles: ["./tests/setup.ts"],
    restoreMocks: true,
  },
});
