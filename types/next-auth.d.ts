import type { ProfileVisibility } from "@/lib/generated/prisma/enums";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      puuid: string | null;
      gameName: string | null;
      tagLine: string | null;
      region: string;
      visibility: ProfileVisibility;
      consentedAt: Date | null;
    } & DefaultSession["user"];
  }

  interface User {
    puuid?: string | null;
    gameName?: string | null;
    tagLine?: string | null;
    region?: string;
    visibility?: ProfileVisibility;
    consentedAt?: Date | null;
  }
}
