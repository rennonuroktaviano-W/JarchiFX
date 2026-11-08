import "dotenv/config";
import { execSync } from "node:child_process";

const host = process.env.DATABASE_HOST ?? "127.0.0.1";
const port = process.env.DATABASE_PORT ?? "3306";
const user = encodeURIComponent(process.env.DATABASE_USER ?? "root");
const password = encodeURIComponent(process.env.DATABASE_PASSWORD ?? "");

export default function setup() {
  const testUrl = `mysql://${user}:${password}@${host}:${port}/jarchifx_test`;
  const shadowUrl = `mysql://${user}:${password}@${host}:${port}/jarchifx_shadow`;

  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL: testUrl,
      SHADOW_DATABASE_URL: shadowUrl,
    },
  });
}
