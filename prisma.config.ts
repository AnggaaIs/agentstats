import { config } from "dotenv";
import { defineConfig } from "prisma/config";

const isDeploy = process.argv.includes("deploy");

config({
  path: isDeploy ? ".env" : ".env.local",
});

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required.");
}

const migrationUrl = databaseUrl.replace(":6543/", ":5432/");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: migrationUrl,
  },
});
