import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",

  // "classic" engine: Prisma v6 reads DATABASE_URL / DIRECT_URL from here
  // instead of from schema.prisma (which no longer supports url/directUrl).
  engine: "classic",
  datasource: {
    url: process.env.DATABASE_URL!,
    directUrl: process.env.DIRECT_URL,
  },
});
