import type { Leaderboard } from "@/lib/riot";
import type { CompetitiveTier } from "@/lib/valorant-api";

const COMPETITIVE_TIERS: Record<
  number,
  { name: string; shortName: string; color: string }
> = {
  24: { name: "Immortal 1", shortName: "Immortal I", color: "#ff6685" },
  25: { name: "Immortal 2", shortName: "Immortal II", color: "#f14f76" },
  26: { name: "Immortal 3", shortName: "Immortal III", color: "#d83d68" },
  27: { name: "Radiant", shortName: "Radiant", color: "#fff0a6" },
};

export interface RankDistributionItem {
  tier: number;
  name: string;
  shortName: string;
  color: string;
  icon: string | null;
  count: number;
  percentage: number;
}

function normalizeTierColor(color: string | undefined): string | null {
  return color && /^[0-9a-f]{8}$/i.test(color)
    ? `#${color.slice(0, 6)}`
    : null;
}

export function getCompetitiveTier(
  tier: number,
  tiers: CompetitiveTier[] = [],
) {
  const liveTier = tiers.find((item) => item.tier === tier);
  const fallback = COMPETITIVE_TIERS[tier];

  return {
    name: liveTier?.tierName ?? fallback?.name ?? `Tier ${tier}`,
    shortName:
      liveTier?.tierName.replace(/ (\d)$/, " $1") ??
      fallback?.shortName ??
      `Tier ${tier}`,
    color: normalizeTierColor(liveTier?.color) ?? fallback?.color ?? "#9aa6b4",
    icon: liveTier?.smallIcon ?? liveTier?.largeIcon ?? null,
  };
}

export function getCompetitiveTierName(
  tier: number,
  tiers: CompetitiveTier[] = [],
): string {
  return getCompetitiveTier(tier, tiers).name;
}

export function buildRankDistribution(
  leaderboard: Leaderboard,
  tiers: CompetitiveTier[] = [],
): RankDistributionItem[] {
  const boundaries = Object.entries(leaderboard.tierDetails)
    .map(([tier, details]) => ({
      tier: Number(tier),
      startingIndex: details.startingIndex,
    }))
    .filter(
      ({ tier, startingIndex }) =>
        Number.isInteger(tier) &&
        Number.isInteger(startingIndex) &&
        startingIndex >= 0,
    )
    .sort((left, right) => left.startingIndex - right.startingIndex);

  return boundaries.map((boundary, index) => {
    const nextBoundary = boundaries[index + 1];
    const count = Math.max(
      0,
      (nextBoundary?.startingIndex ?? leaderboard.totalPlayers) -
        boundary.startingIndex,
    );
    const tier = getCompetitiveTier(boundary.tier, tiers);

    return {
      tier: boundary.tier,
      ...tier,
      count,
      percentage:
        leaderboard.totalPlayers > 0
          ? (count / leaderboard.totalPlayers) * 100
          : 0,
    };
  });
}
