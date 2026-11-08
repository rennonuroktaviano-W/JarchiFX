import "dotenv/config";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

const host = process.env.DATABASE_HOST ?? "127.0.0.1";
const port = process.env.DATABASE_PORT ?? "3306";
const user = encodeURIComponent(process.env.DATABASE_USER ?? "root");
const password = encodeURIComponent(process.env.DATABASE_PASSWORD ?? "");
const testDatabaseUrl = `mysql://${user}:${password}@${host}:${port}/jarchifx_test`;

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      "server-only": fileURLToPath(
        new URL("./node_modules/server-only/empty.js", import.meta.url),
      ),
    },
  },
  test: {
    environment: "node",
    fileParallelism: false,
    globalSetup: ["./tests/global-setup.ts"],
    setupFiles: ["./tests/setup.ts"],
    env: {
      DATABASE_NAME: "jarchifx_test",
      DATABASE_URL: testDatabaseUrl,
      PAYMENT_MOCK: "true",
    },
  },
});
