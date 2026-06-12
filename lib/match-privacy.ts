import type { RiotMatch } from "@/lib/riot";

export function redactMatch(
  match: RiotMatch,
  visiblePuuids: ReadonlySet<string>,
): RiotMatch {
  const isVisible = (puuid: string | undefined): puuid is string =>
    Boolean(puuid && visiblePuuids.has(puuid));

  return {
    ...match,
    players: match.players.filter((player) => isVisible(player.puuid)),
    roundResults: match.roundResults.map((round) => ({
      ...round,
      bombPlanter: isVisible(round.bombPlanter) ? round.bombPlanter : undefined,
      bombDefuser: isVisible(round.bombDefuser) ? round.bombDefuser : undefined,
      playerStats: round.playerStats
        .filter((stats) => isVisible(stats.puuid))
        .map((stats) => ({
          ...stats,
          kills: stats.kills?.filter(
            (kill) =>
              isVisible(kill.killer) &&
              isVisible(kill.victim) &&
              kill.assistants.every(isVisible),
          ),
          damage: stats.damage.filter((hit) => isVisible(hit.receiver)),
        })),
    })),
  };
}
