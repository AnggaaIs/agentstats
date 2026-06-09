import type { Leaderboard } from "@/lib/riot";

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
  count: number;
  percentage: number;
}

export function getCompetitiveTierName(tier: number): string {
  return COMPETITIVE_TIERS[tier]?.name ?? `Tier ${tier}`;
}

export function buildRankDistribution(
  leaderboard: Leaderboard,
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
        startingIndex > 0,
    )
    .sort((left, right) => left.startingIndex - right.startingIndex);

  return boundaries.map((boundary, index) => {
    const nextBoundary = boundaries[index + 1];
    const count =
      (nextBoundary?.startingIndex ?? leaderboard.totalPlayers + 1) -
      boundary.startingIndex;
    const tier = COMPETITIVE_TIERS[boundary.tier] ?? {
      name: `Tier ${boundary.tier}`,
      shortName: `Tier ${boundary.tier}`,
      color: "#9aa6b4",
    };

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
