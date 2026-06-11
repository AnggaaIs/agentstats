import "server-only";

import { auth } from "@/auth";
import { isRsoConfigured } from "@/lib/auth-config";
import { ProfileVisibility } from "@/lib/generated/prisma/enums";
import { prisma } from "@/lib/db";
import type { RiotMatch } from "@/lib/riot";

export interface PlayerAccess {
  isLinked: boolean;
  isOwner: boolean;
  isPublic: boolean;
  canViewStats: boolean;
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
      },
    }),
  ]);
  const isOwner = Boolean(
    linkedPlayer && session?.user?.id === linkedPlayer.id,
  );
  const isPublic = Boolean(
    linkedPlayer?.visibility === ProfileVisibility.PUBLIC &&
      linkedPlayer.consentedAt,
  );

  return {
    isLinked: Boolean(linkedPlayer),
    isOwner,
    isPublic,
    canViewStats: isOwner || isPublic,
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
