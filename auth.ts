import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import type { OAuthConfig } from "next-auth/providers";
import { cookies } from "next/headers";
import { z } from "zod";

import { isRsoConfigured } from "@/lib/auth-config";
import { LEGAL_CONSENT_COOKIE } from "@/lib/legal";
import { prisma } from "@/lib/db";

const riotAccountSchema = z.object({
  puuid: z.string().min(1),
  gameName: z.string().min(1),
  tagLine: z.string().min(1),
});

type RiotProfile = z.infer<typeof riotAccountSchema>;

async function getRsoAccount(accessToken: string): Promise<RiotProfile> {
  for (const routingRegion of ["asia", "americas", "europe"] as const) {
    const response = await fetch(
      `https://${routingRegion}.api.riotgames.com/riot/account/v1/accounts/me`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      },
    );

    if (response.ok) {
      return riotAccountSchema.parse(await response.json());
    }
    if (response.status !== 404) break;
  }

  throw new Error("Riot account verification failed.");
}

function riotProvider(): OAuthConfig<RiotProfile> {
  return {
    id: "riot",
    name: "Riot Games",
    type: "oauth",
    clientId: process.env.RIOT_CLIENT_ID,
    clientSecret: process.env.RIOT_CLIENT_SECRET,
    authorization: {
      url: "https://auth.riotgames.com/authorize",
      params: {
        scope: "openid offline_access",
        response_type: "code",
      },
    },
    token: "https://auth.riotgames.com/token",
    checks: ["state"],
    client: {
      token_endpoint_auth_method: "client_secret_basic",
    },
    userinfo: {
      async request({ tokens }: { tokens: { access_token?: string } }) {
        if (!tokens.access_token) {
          throw new Error("Riot did not return an access token.");
        }

        return getRsoAccount(tokens.access_token);
      },
    },
    profile(profile) {
      return {
        id: profile.puuid,
        name: `${profile.gameName}#${profile.tagLine}`,
        email: null,
        image: null,
        puuid: profile.puuid,
        gameName: profile.gameName,
        tagLine: profile.tagLine,
      };
    },
    account(tokens) {
      return {
        scope: tokens.scope,
        token_type: tokens.token_type,
      };
    },
    style: {
      brandColor: "#d13639",
    },
  };
}

const providers = isRsoConfigured() ? [riotProvider()] : [];

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  providers,
  pages: {
    signIn: "/login",
    error: "/login",
    newUser: "/account",
  },
  session: {
    strategy: "database",
    maxAge: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id;
      session.user.puuid = user.puuid ?? null;
      session.user.gameName = user.gameName ?? null;
      session.user.tagLine = user.tagLine ?? null;
      session.user.region = user.region ?? "ap";
      session.user.visibility = user.visibility ?? "PRIVATE";
      session.user.consentedAt = user.consentedAt ?? null;
      return session;
    },
  },
  events: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== "riot") return;

      const parsed = riotAccountSchema.safeParse(profile);
      if (!parsed.success) return;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          puuid: parsed.data.puuid,
          gameName: parsed.data.gameName,
          tagLine: parsed.data.tagLine,
          name: `${parsed.data.gameName}#${parsed.data.tagLine}`,
          lastProfileSyncAt: new Date(),
        },
      });

      try {
        const cookieStore = await cookies();
        const token = cookieStore.get(LEGAL_CONSENT_COOKIE)?.value;

        if (token) {
          await prisma.legalConsent.update({
            where: { token },
            data: {
              userId: user.id,
              linkedAt: new Date(),
            },
          });
          cookieStore.delete(LEGAL_CONSENT_COOKIE);
        }
      } catch {
        // Keep sign-in working even if consent linkage fails; the login action
        // already recorded the acceptance row in the database.
      }
    },
  },
});
