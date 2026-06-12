import type { ImprovementMetric } from "@/lib/generated/prisma/enums";
import type {
  MatchSummary,
  PlayerFormWindow,
  PlayerSummary,
} from "@/lib/player-stats";

export interface EvidenceInsight {
  id: string;
  kind: "focus" | "strength";
  title: string;
  finding: string;
  evidence: string;
  action: string;
  score: number;
  matchIds: string[];
}

export interface SessionDebrief {
  matches: MatchSummary[];
  form: PlayerFormWindow;
  startedAt: number;
  endedAt: number;
  previousForm: PlayerFormWindow | null;
  acsDelta: number | null;
  winRateDelta: number | null;
  headline: string;
  reviewMatch: MatchSummary | null;
}

export interface ImprovementMetricDefinition {
  id: ImprovementMetric;
  label: string;
  unit: "%" | "ACS" | "damage / 1k";
  direction: "higher" | "lower";
  description: string;
}

export const IMPROVEMENT_METRICS: readonly ImprovementMetricDefinition[] = [
  {
    id: "OPENING_CONVERSION",
    label: "Opening conversion",
    unit: "%",
    direction: "higher",
    description: "Rounds won after you secure the first kill.",
  },
  {
    id: "SURVIVAL_RATE",
    label: "Survival rate",
    unit: "%",
    direction: "higher",
    description: "Tracked rounds where you were alive at round end.",
  },
  {
    id: "KAST",
    label: "KAST",
    unit: "%",
    direction: "higher",
    description: "Rounds with a kill, assist, survival, or traded death.",
  },
  {
    id: "PISTOL_WIN_RATE",
    label: "Pistol win rate",
    unit: "%",
    direction: "higher",
    description: "Regulation pistol rounds won in competitive or unrated.",
  },
  {
    id: "ECONOMY_DAMAGE",
    label: "Full-buy damage efficiency",
    unit: "damage / 1k",
    direction: "higher",
    description: "Damage per 1,000 credits of full-buy loadout value.",
  },
  {
    id: "CONSISTENCY",
    label: "ACS deviation",
    unit: "ACS",
    direction: "lower",
    description: "Match-to-match ACS standard deviation.",
  },
] as const;

function summarizeMatches(matches: MatchSummary[]): PlayerFormWindow {
  let wins = 0;
  let losses = 0;
  let draws = 0;
  let kills = 0;
  let deaths = 0;
  let assists = 0;
  let rounds = 0;
  let score = 0;
  let damage = 0;

  for (const match of matches) {
    if (match.result === "WIN") wins += 1;
    if (match.result === "LOSS") losses += 1;
    if (match.result === "DRAW") draws += 1;
    kills += match.kills;
    deaths += match.deaths;
    assists += match.assists;
    rounds += match.rounds;
    score += match.acs * match.rounds;
    damage += match.damagePerRound * match.rounds;
  }

  return {
    games: matches.length,
    wins,
    losses,
    draws,
    winRate: matches.length === 0 ? 0 : (wins / matches.length) * 100,
    kills,
    deaths,
    assists,
    kd: deaths === 0 ? kills : kills / deaths,
    averageAcs: rounds === 0 ? 0 : score / rounds,
    averageDamagePerRound: rounds === 0 ? 0 : damage / rounds,
  };
}

export function getMetricDefinition(
  metric: ImprovementMetric,
): ImprovementMetricDefinition {
  return (
    IMPROVEMENT_METRICS.find((definition) => definition.id === metric) ??
    IMPROVEMENT_METRICS[0]
  );
}

export function getMetricValue(
  summary: PlayerSummary,
  metric: ImprovementMetric,
): number {
  if (metric === "OPENING_CONVERSION") {
    return summary.roundImpact.openingKillConversion;
  }
  if (metric === "SURVIVAL_RATE") return summary.roundImpact.survivalRate;
  if (metric === "KAST") return summary.kast;
  if (metric === "PISTOL_WIN_RATE") return summary.pistolRounds.winRate;
  if (metric === "ECONOMY_DAMAGE") {
    return (
      summary.economy.find((bucket) => bucket.id === "full")
        ?.damagePerThousandLoadout ?? 0
    );
  }
  return summary.consistencyReport.acsDeviation;
}

export function buildEvidenceCoach(
  summary: PlayerSummary,
): EvidenceInsight[] {
  const candidates: EvidenceInsight[] = [];
  const firstDeathMatches = summary.matches
    .filter((match) => match.firstDeaths > 0)
    .slice(0, 3)
    .map((match) => match.matchId);
  const openingMatches = summary.matches
    .filter((match) => match.firstBloods > 0)
    .slice(0, 3)
    .map((match) => match.matchId);
  const lossMatches = summary.matches
    .filter((match) => match.result === "LOSS")
    .toSorted((left, right) => left.acs - right.acs)
    .slice(0, 3)
    .map((match) => match.matchId);

  if (
    summary.roundImpact.firstDeathRounds >= 3 &&
    summary.roundImpact.nonTradedDeathRate >= 45
  ) {
    candidates.push({
      id: "non-traded-deaths",
      kind: "focus",
      title: "Make early deaths tradeable",
      finding: `${summary.roundImpact.nonTradedDeathRate.toFixed(0)}% of tracked deaths were not traded within five seconds.`,
      evidence: `${summary.roundImpact.nonTradedDeaths} non-traded deaths across ${summary.trades.trackedDeaths} timeline deaths.`,
      action:
        "Before taking the first duel, identify the teammate who can immediately swing or recover your space.",
      score: summary.roundImpact.nonTradedDeathRate + 20,
      matchIds: firstDeathMatches,
    });
  }

  if (
    summary.roundImpact.openingKillRounds >= 3 &&
    summary.roundImpact.openingKillConversion < 60
  ) {
    candidates.push({
      id: "opening-conversion",
      kind: "focus",
      title: "Convert opening advantages",
      finding: `Your team won ${summary.roundImpact.openingKillConversion.toFixed(0)}% of rounds after your first kill.`,
      evidence: `${summary.roundImpact.openingKillRoundWins} wins from ${summary.roundImpact.openingKillRounds} opening-kill rounds.`,
      action:
        "After the opening kill, avoid the immediate re-peek and play the numbers advantage with the nearest teammate.",
      score: 80 - summary.roundImpact.openingKillConversion,
      matchIds: openingMatches,
    });
  }

  if (
    summary.pistolRounds.rounds >= 4 &&
    summary.pistolRounds.winRate < 45
  ) {
    candidates.push({
      id: "pistol-rounds",
      kind: "focus",
      title: "Review pistol-round decisions",
      finding: `Pistol win rate is ${summary.pistolRounds.winRate.toFixed(0)}%.`,
      evidence: `${summary.pistolRounds.wins} wins in ${summary.pistolRounds.rounds} regulation pistol rounds, with ${summary.pistolRounds.damagePerRound.toFixed(0)} damage per round.`,
      action:
        "Choose one repeatable pistol plan for each side and review whether utility and spacing support the first contact.",
      score: 65 - summary.pistolRounds.winRate,
      matchIds: lossMatches,
    });
  }

  const fullBuy = summary.economy.find((bucket) => bucket.id === "full");
  const midBuy = summary.economy.find((bucket) => bucket.id === "mid");
  if (
    fullBuy &&
    midBuy &&
    fullBuy.rounds >= 5 &&
    fullBuy.damagePerThousandLoadout <
      midBuy.damagePerThousandLoadout * 0.85
  ) {
    candidates.push({
      id: "full-buy-efficiency",
      kind: "focus",
      title: "Protect full-buy value",
      finding: `Full-buy damage efficiency is ${fullBuy.damagePerThousandLoadout.toFixed(0)} per 1,000 loadout credits.`,
      evidence: `Mid-buy efficiency is ${midBuy.damagePerThousandLoadout.toFixed(0)} across ${midBuy.rounds} rounds.`,
      action:
        "Review full-buy deaths before first contact and whether expensive utility or weapons are lost without a trade.",
      score:
        midBuy.damagePerThousandLoadout -
        fullBuy.damagePerThousandLoadout +
        20,
      matchIds: lossMatches,
    });
  }

  if (
    summary.sessions.laterMatches.games >= 3 &&
    summary.sessions.firstMatches.averageAcs -
      summary.sessions.laterMatches.averageAcs >=
      20
  ) {
    candidates.push({
      id: "session-drop",
      kind: "focus",
      title: "Shorten declining sessions",
      finding: `ACS drops ${(
        summary.sessions.firstMatches.averageAcs -
        summary.sessions.laterMatches.averageAcs
      ).toFixed(0)} after the first match of a session.`,
      evidence: `${summary.sessions.count} sessions with a longest run of ${summary.sessions.longestSession} matches.`,
      action:
        "Use a stop rule after two declining games: take a break, review one match, then decide whether to continue.",
      score:
        summary.sessions.firstMatches.averageAcs -
        summary.sessions.laterMatches.averageAcs,
      matchIds: summary.matches.slice(0, 3).map((match) => match.matchId),
    });
  }

  if (summary.kast >= 75 && summary.rounds >= 80) {
    candidates.push({
      id: "kast-strength",
      kind: "strength",
      title: "Reliable round participation",
      finding: `KAST is ${summary.kast.toFixed(1)}% across ${summary.rounds} rounds.`,
      evidence: `${summary.trades.tradedDeaths} deaths were traded and survival rate is ${summary.roundImpact.survivalRate.toFixed(0)}%.`,
      action:
        "Preserve this strength while testing one more proactive opening per match.",
      score: summary.kast - 55,
      matchIds: summary.matches.slice(0, 3).map((match) => match.matchId),
    });
  }

  if (
    summary.roundImpact.openingKillRounds >= 4 &&
    summary.roundImpact.openingKillConversion >= 70
  ) {
    candidates.push({
      id: "opening-strength",
      kind: "strength",
      title: "Openings create real round value",
      finding: `${summary.roundImpact.openingKillConversion.toFixed(0)}% of your opening-kill rounds converted into wins.`,
      evidence: `${summary.roundImpact.openingKillRoundWins} converted rounds from ${summary.roundImpact.openingKillRounds} openings.`,
      action:
        "Keep the same opening conditions and document the maps and agents where this pattern repeats.",
      score: summary.roundImpact.openingKillConversion - 40,
      matchIds: openingMatches,
    });
  }

  if (candidates.length < 3) {
    candidates.push({
      id: "sample-discipline",
      kind: "focus",
      title: "Build a cleaner review sample",
      finding: `${summary.games} completed matches are available in the current window.`,
      evidence: `The sample contains ${summary.rounds} rounds across ${summary.sessions.count} sessions.`,
      action:
        "Keep one improvement target unchanged for the next five matches before judging the result.",
      score: 5,
      matchIds: summary.matches.slice(0, 3).map((match) => match.matchId),
    });
  }

  return candidates
    .toSorted((left, right) => right.score - left.score)
    .slice(0, 3);
}

export function buildSessionDebrief(
  summary: PlayerSummary,
): SessionDebrief | null {
  const chronological = summary.matches.toSorted(
    (left, right) => left.playedAt - right.playedAt,
  );
  const sessions: MatchSummary[][] = [];

  for (const match of chronological) {
    const current = sessions.at(-1);
    const previous = current?.at(-1);
    const previousEnd = previous
      ? previous.playedAt + previous.durationMillis
      : null;
    if (
      !current ||
      previousEnd === null ||
      match.playedAt - previousEnd > 90 * 60_000
    ) {
      sessions.push([match]);
    } else {
      current.push(match);
    }
  }

  const latest = sessions.at(-1);
  if (!latest?.length) return null;
  const previous = sessions.at(-2);
  const form = summarizeMatches(latest);
  const previousForm = previous ? summarizeMatches(previous) : null;
  const acsDelta = previousForm
    ? form.averageAcs - previousForm.averageAcs
    : null;
  const winRateDelta = previousForm ? form.winRate - previousForm.winRate : null;
  const reviewMatch =
    latest
      .filter((match) => match.result === "LOSS")
      .toSorted((left, right) => left.acs - right.acs)[0] ??
    latest.toSorted((left, right) => left.acs - right.acs)[0] ??
    null;

  return {
    matches: latest,
    form,
    startedAt: latest[0].playedAt,
    endedAt:
      latest.at(-1)!.playedAt + latest.at(-1)!.durationMillis,
    previousForm,
    acsDelta,
    winRateDelta,
    headline:
      acsDelta === null
        ? "First tracked session baseline"
        : acsDelta >= 15
          ? "Output improved from the previous session"
          : acsDelta <= -15
            ? "Output declined from the previous session"
            : "Output stayed close to the previous session",
    reviewMatch,
  };
}
