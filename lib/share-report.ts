import { z } from "zod";

import type { EvidenceInsight, SessionDebrief } from "@/lib/improvement";
import type { PlayerSummary } from "@/lib/player-stats";

export const shareReportSnapshotSchema = z.object({
  version: z.literal(1),
  identity: z.object({
    gameName: z.string().nullable(),
    tagLine: z.string().nullable(),
    region: z.string(),
  }),
  generatedAt: z.number(),
  sample: z.object({
    games: z.number(),
    rounds: z.number(),
    wins: z.number(),
    losses: z.number(),
  }),
  metrics: z.array(
    z.object({
      label: z.string(),
      value: z.string(),
      note: z.string(),
    }),
  ),
  coach: z.array(
    z.object({
      kind: z.enum(["focus", "strength"]),
      title: z.string(),
      finding: z.string(),
      evidence: z.string(),
      action: z.string(),
    }),
  ),
  session: z
    .object({
      games: z.number(),
      winRate: z.number(),
      averageAcs: z.number(),
      averageDamagePerRound: z.number(),
      headline: z.string(),
    })
    .nullable(),
  topAgents: z.array(
    z.object({
      name: z.string(),
      games: z.number(),
      winRate: z.number(),
      averageAcs: z.number(),
    }),
  ),
  topMaps: z.array(
    z.object({
      name: z.string(),
      games: z.number(),
      winRate: z.number(),
      averageAcs: z.number(),
    }),
  ),
});

export type ShareReportSnapshot = z.infer<typeof shareReportSnapshotSchema>;

export function buildShareReportSnapshot({
  summary,
  coach,
  debrief,
  gameName,
  tagLine,
  region,
  anonymized,
}: {
  summary: PlayerSummary;
  coach: EvidenceInsight[];
  debrief: SessionDebrief | null;
  gameName: string | null;
  tagLine: string | null;
  region: string;
  anonymized: boolean;
}): ShareReportSnapshot {
  return {
    version: 1,
    identity: {
      gameName: anonymized ? null : gameName,
      tagLine: anonymized ? null : tagLine,
      region,
    },
    generatedAt: Date.now(),
    sample: {
      games: summary.games,
      rounds: summary.rounds,
      wins: summary.wins,
      losses: summary.losses,
    },
    metrics: [
      {
        label: "Average ACS",
        value: summary.averageAcs.toFixed(0),
        note: `${summary.rounds} rounds`,
      },
      {
        label: "KAST",
        value: `${summary.kast.toFixed(1)}%`,
        note: "Kill, assist, survive, or traded",
      },
      {
        label: "Opening conversion",
        value: `${summary.roundImpact.openingKillConversion.toFixed(0)}%`,
        note: `${summary.roundImpact.openingKillRoundWins}/${summary.roundImpact.openingKillRounds} rounds`,
      },
      {
        label: "Survival",
        value: `${summary.roundImpact.survivalRate.toFixed(0)}%`,
        note: `${summary.roundImpact.survivedRounds} survived rounds`,
      },
      {
        label: "Pistol win rate",
        value: `${summary.pistolRounds.winRate.toFixed(0)}%`,
        note: `${summary.pistolRounds.rounds} pistol rounds`,
      },
      {
        label: "ACS deviation",
        value: summary.consistencyReport.acsDeviation.toFixed(1),
        note: "Lower means more consistent",
      },
    ],
    coach: coach.map((insight) => ({
      kind: insight.kind,
      title: insight.title,
      finding: insight.finding,
      evidence: insight.evidence,
      action: insight.action,
    })),
    session: debrief
      ? {
          games: debrief.form.games,
          winRate: debrief.form.winRate,
          averageAcs: debrief.form.averageAcs,
          averageDamagePerRound: debrief.form.averageDamagePerRound,
          headline: debrief.headline,
        }
      : null,
    topAgents: summary.agents.slice(0, 3).map((agent) => ({
      name: agent.name,
      games: agent.games,
      winRate: agent.winRate,
      averageAcs: agent.averageAcs,
    })),
    topMaps: summary.maps.slice(0, 3).map((map) => ({
      name: map.name,
      games: map.games,
      winRate: map.winRate,
      averageAcs: map.averageAcs,
    })),
  };
}
