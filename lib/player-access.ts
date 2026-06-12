import "server-only";

import { auth } from "@/auth";
import { isRsoConfigured } from "@/lib/auth-config";
import { ProfileVisibility } from "@/lib/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { PLAYER_DATA_CONSENT_VERSION } from "@/lib/legal";
import type { RiotMatch } from "@/lib/riot";

export interface PlayerAccess {
  isLinked: boolean;
  isOwner: boolean;
  isPublic: boolean;
  canViewStats: boolean;
  hasCurrentDataConsent: boolean;
  ownerId: string | null;
}

export interface MatchAccess {
  canView: boolean;
  canSeeFullScoreboard: boolean;
  publicPuuids: Set<string>;
  viewerPuuid: string | null;
}

export async function getPlayerAccess(puuid: string): Promise<PlayerAccess> {
  if (!isRsoConfigured()) {
    return {
      isLinked: false,
      isOwner: false,
      isPublic: false,
      canViewStats: false,
      hasCurrentDataConsent: false,
      ownerId: null,
    };
  }

  const [session, linkedPlayer] = await Promise.all([
    auth(),
    prisma.user.findUnique({
      where: { puuid },
      select: {
        id: true,
        visibility: true,
        consentedAt: true,
        consentVersion: true,
      },
    }),
  ]);
  const isOwner = Boolean(
    linkedPlayer && session?.user?.id === linkedPlayer.id,
  );
  const isPublic = Boolean(
    linkedPlayer?.visibility === ProfileVisibility.PUBLIC &&
      linkedPlayer.consentedAt &&
      linkedPlayer.consentVersion === PLAYER_DATA_CONSENT_VERSION,
  );
  const hasCurrentDataConsent = Boolean(
    linkedPlayer?.consentedAt &&
      linkedPlayer.consentVersion === PLAYER_DATA_CONSENT_VERSION,
  );

  return {
    isLinked: Boolean(linkedPlayer),
    isOwner,
    isPublic,
    canViewStats: isOwner || isPublic,
    hasCurrentDataConsent,
    ownerId: linkedPlayer?.id ?? null,
  };
}

export async function requireViewer() {
  if (!isRsoConfigured()) return null;
  return auth();
}

export async function canViewMatch(match: RiotMatch): Promise<boolean> {
  return (await getMatchAccess(match)).canView;
}

export async function getMatchAccess(match: RiotMatch): Promise<MatchAccess> {
  if (!isRsoConfigured()) {
    return {
      canView: false,
      canSeeFullScoreboard: false,
      publicPuuids: new Set(),
      viewerPuuid: null,
    };
  }

  const session = await auth();
  if (
    session?.user?.puuid &&
    match.players.some((player) => player.puuid === session.user.puuid)
  ) {
    return {
      canView: true,
      canSeeFullScoreboard: true,
      publicPuuids: new Set([session.user.puuid]),
      viewerPuuid: session.user.puuid,
    };
  }

  const publicParticipants = await prisma.user.findMany({
    where: {
      puuid: { in: match.players.map((player) => player.puuid) },
      visibility: ProfileVisibility.PUBLIC,
      consentedAt: { not: null },
      consentVersion: PLAYER_DATA_CONSENT_VERSION,
    },
    select: { puuid: true },
  });
  const publicPuuids = new Set(
    publicParticipants.flatMap((participant) =>
      participant.puuid ? [participant.puuid] : [],
    ),
  );

  return {
    canView: publicPuuids.size > 0,
    canSeeFullScoreboard: false,
    publicPuuids,
    viewerPuuid: null,
  };
}
