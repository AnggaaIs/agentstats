import { cookies } from "next/headers";

import { prisma } from "@/lib/db";
import { FavoriteCategory } from "@/lib/generated/prisma/enums";
import {
  COMMUNITY_DEVICE_COOKIE,
  hashDeviceToken,
  verifyDeviceCredential,
} from "@/lib/community-security";

export const FAVORITE_CATEGORIES = ["agent", "map", "weapon"] as const;
export type FavoriteCategoryName = (typeof FAVORITE_CATEGORIES)[number];
export const DEFAULT_FAVORITE_SCOPE = "default";

export interface CommunityCount {
  targetId: string;
  scopeKey: string;
  votes: number;
}

export interface CurrentFavorites {
  agent: Record<string, string>;
  map: string | null;
  weapon: string | null;
}

const CATEGORY_TO_DATABASE = {
  agent: FavoriteCategory.AGENT,
  map: FavoriteCategory.MAP,
  weapon: FavoriteCategory.WEAPON,
} satisfies Record<FavoriteCategoryName, FavoriteCategory>;

export function toDatabaseCategory(
  category: FavoriteCategoryName,
): FavoriteCategory {
  return CATEGORY_TO_DATABASE[category];
}

export function toFavoriteScope(value: string | null | undefined): string {
  const normalized = value?.trim().toLocaleLowerCase().replace(/\s+/g, "-");
  return normalized || DEFAULT_FAVORITE_SCOPE;
}

export async function getCommunityCounts(
  category: FavoriteCategoryName,
): Promise<CommunityCount[]> {
  const rows = await prisma.communityVote.groupBy({
    by: ["targetId", "scopeKey"],
    where: { category: toDatabaseCategory(category) },
    _count: { _all: true },
    orderBy: { _count: { targetId: "desc" } },
  });

  return rows.map((row) => ({
    targetId: row.targetId,
    scopeKey: row.scopeKey,
    votes: row._count._all,
  }));
}

export async function getCommunityOverview() {
  const [agent, map, weapon, devices] = await Promise.all([
    getCommunityCounts("agent"),
    getCommunityCounts("map"),
    getCommunityCounts("weapon"),
    prisma.communityVote.groupBy({ by: ["deviceHash"] }),
  ]);

  return {
    counts: { agent, map, weapon },
    participants: devices.length,
    totalVotes:
      agent.reduce((sum, item) => sum + item.votes, 0) +
      map.reduce((sum, item) => sum + item.votes, 0) +
      weapon.reduce((sum, item) => sum + item.votes, 0),
  };
}

export async function getCurrentFavorites(): Promise<CurrentFavorites> {
  const cookieStore = await cookies();
  const token = verifyDeviceCredential(
    cookieStore.get(COMMUNITY_DEVICE_COOKIE)?.value,
  );

  if (!token) {
    return { agent: {}, map: null, weapon: null };
  }

  const votes = await prisma.communityVote.findMany({
    where: { deviceHash: hashDeviceToken(token) },
    select: { category: true, scopeKey: true, targetId: true },
  });

  const favorites: CurrentFavorites = {
    agent: {},
    map: null,
    weapon: null,
  };

  for (const vote of votes) {
    if (vote.category === FavoriteCategory.AGENT) {
      favorites.agent[vote.scopeKey] = vote.targetId;
    } else if (vote.category === FavoriteCategory.MAP) {
      favorites.map = vote.targetId;
    } else {
      favorites.weapon = vote.targetId;
    }
  }

  return favorites;
}
