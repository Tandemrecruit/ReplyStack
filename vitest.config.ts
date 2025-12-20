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
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "html", "json"],
      exclude: [
        "node_modules/**",
        "tests/**",
        "**/*.test.ts",
        "**/*.test.tsx",
        "**/*.config.*",
        "next.config.*",
        "**/types.ts",
        "scripts/**",
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 65,
        statements: 70,
      },
    },
  },
});
