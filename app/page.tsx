import type { Metadata } from "next";
import Image from "next/image";

import { PlayerSearch } from "@/components/player-search";
import { RouteLink } from "@/components/route-link";
import {
  buildEmptyAgentMetaDataset,
  buildEmptyMapMetaDataset,
  getAgentMetaDataset,
  getMapMetaDataset,
} from "@/lib/agent-meta";
import { createMetadata } from "@/lib/seo";
import {
  getAgents,
  getCurrentAct,
  getMaps,
  getValorantVersion,
} from "@/lib/valorant-api";

export const metadata: Metadata = createMetadata({
  title: "AgentStats - Valorant Stats, Agents, Skins & Leaderboards",
  description:
    "Explore Valorant agents, weapons, skins, bundles, maps, ranked leaderboards, service status, and player lookup tools.",
  path: "/",
});

function formatNumber(value: number, digits = 0): string {
  return value.toFixed(digits);
}

function formatPercent(value: number, digits = 1): string {
  return `${formatNumber(value, digits)}%`;
}

function formatObservedAt(value: Date | null): string {
  if (!value) return "Waiting for opt-in data";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(value);
}

export default async function HomePage() {
  const [agents, maps, versionResult, currentAct] = await Promise.all([
    getAgents(),
    getMaps(),
    getValorantVersion().then(
      (value) => ({ status: "fulfilled" as const, value }),
      () => ({ status: "rejected" as const }),
    ),
    getCurrentAct().catch(() => null),
  ]);
  const patchVersion =
    versionResult.status === "fulfilled"
      ? versionResult.value.branch.replace("release-", "")
      : "Unavailable";
  const [agentMeta, mapMeta] = await Promise.all([
    getAgentMetaDataset(agents, currentAct?.uuid).catch(() =>
      buildEmptyAgentMetaDataset(agents),
    ),
    getMapMetaDataset(maps, currentAct?.uuid).catch(() =>
      buildEmptyMapMetaDataset(maps),
    ),
  ]);
  const featuredAgent =
    agents.find((agent) => agent.displayName === "Jett") ?? agents[0];
  const featuredPortrait =
    featuredAgent.fullPortrait ?? featuredAgent.displayIcon;
  const topMetaAgent =
    agentMeta.rows.find((agent) => agent.picks > 0) ?? agentMeta.rows[0];
  const metaPreviewRows = agentMeta.rows.slice(0, 8);
  const mapPreviewRows = (
    mapMeta.rows.some((row) => row.modeId === "competitive")
      ? mapMeta.rows.filter((row) => row.modeId === "competitive")
      : mapMeta.rows
  ).slice(0, 6);

  return (
    <>
      <section className="grid-noise relative isolate overflow-hidden border-b border-white/8">
        <div className="absolute inset-y-0 right-0 -z-20 hidden w-[48%] bg-[linear-gradient(135deg,rgba(255,70,85,0.1),transparent_46%)] lg:block" />
        <div className="pointer-events-none absolute inset-y-0 right-0 -z-10 hidden w-[42%] opacity-45 lg:block">
          <Image
            src={featuredPortrait}
            fill
            priority
            unoptimized
            alt=""
            sizes="42vw"
            className="object-contain object-right-bottom"
          />
        </div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[var(--ink)] via-[var(--ink)]/95 to-[var(--ink)]/70" />

        <div className="mx-auto grid w-full max-w-[86rem] gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:px-8 lg:py-10">
          <div className="relative z-10 min-w-0">
            <p className="eyebrow">Valorant tracker</p>
            <h1 className="responsive-text mt-4 max-w-3xl font-display text-[clamp(2.75rem,9vw,5rem)] font-black uppercase leading-[0.84] tracking-[-0.07em]">
              Valorant stats
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--muted)]">
              Search a Riot ID, inspect match history, and track agent meta.
            </p>
            <div className="mt-6 min-w-0 max-w-3xl overflow-hidden">
              <div id="search">
                <PlayerSearch />
              </div>
            </div>
          </div>

          <aside className="relative z-10 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {[
              {
                label: "Top meta agent",
                value: topMetaAgent?.picks ? topMetaAgent.name : "Pending",
                detail: topMetaAgent?.picks
                  ? `${formatPercent(topMetaAgent.pickRate)} pick rate`
                  : "Waiting for match samples",
              },
              {
                label: "Tracked players",
                value: agentMeta.trackedPlayers.toString(),
                detail: `${agentMeta.totalPicks} agent picks indexed`,
              },
              {
                label: "Current patch",
                value: patchVersion,
                detail: currentAct?.displayLabel ?? "Competitive archive ready",
              },
            ].map((card) => (
              <div key={card.label} className="border border-white/10 bg-[var(--panel)]/80 p-4 backdrop-blur">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--accent)]">
                  {card.label}
                </p>
                <p className="responsive-text mt-2 font-display text-2xl font-black uppercase tracking-[-0.04em]">
                  {card.value}
                </p>
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
                  {card.detail}
                </p>
              </div>
            ))}
          </aside>
        </div>
      </section>

      <section
        id="agent-meta"
        className="mx-auto max-w-[86rem] px-4 py-9 sm:px-6 lg:px-8 lg:py-10"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Agent meta</p>
            <h2 className="mt-3 font-display text-3xl font-black uppercase tracking-[-0.05em]">
              Pick rate snapshot
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              Competitive aggregate from opt-in match observations.
            </p>
          </div>
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
            {agentMeta.trackedPlayers} tracked players / updated{" "}
            {formatObservedAt(agentMeta.lastObservedAt)}
          </p>
        </div>

        <div
          role="region"
          aria-label="Agent pick rate preview table"
          tabIndex={0}
          className="tactical-scrollbar mt-6 overflow-x-auto border border-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          <table className="w-full min-w-[64rem] border-collapse text-left">
            <thead className="bg-white/[0.045] text-[10px] font-black uppercase tracking-[0.16em] text-[var(--muted)]">
              <tr>
                <th className="px-4 py-3 sm:px-5">Agent</th>
                <th className="px-4 py-3 sm:px-5">Role</th>
                <th className="px-4 py-3 text-right sm:px-5">Picks</th>
                <th className="px-4 py-3 text-right sm:px-5">Pick rate</th>
                <th className="px-4 py-3 text-right sm:px-5">Win rate</th>
                <th className="px-4 py-3 text-right sm:px-5">K/D</th>
                <th className="px-4 py-3 text-right sm:px-5">ACS</th>
                <th className="px-4 py-3 text-right sm:px-5">ADR</th>
                <th className="px-4 py-3 text-right sm:px-5">HS%</th>
                <th className="px-4 py-3 text-right sm:px-5">KAST</th>
              </tr>
            </thead>
            <tbody>
              {metaPreviewRows.map((agent) => (
                <tr
                  key={agent.agentId}
                  className="border-t border-white/8 transition-colors hover:bg-white/[0.025]"
                >
                  <td className="px-4 py-2.5 sm:px-5">
                    <RouteLink
                      href={`/agents/${agent.agentId}`}
                      className="flex items-center gap-3 font-black uppercase focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                    >
                      <span className="relative size-9 shrink-0 overflow-hidden bg-[#202832]">
                        <Image
                          src={agent.icon}
                          alt=""
                          fill
                          sizes="36px"
                          className="object-cover"
                        />
                      </span>
                      {agent.name}
                    </RouteLink>
                  </td>
                  <td className="px-4 py-2.5 sm:px-5">
                    <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
                      {agent.roleIcon ? (
                        <Image
                          src={agent.roleIcon}
                          alt=""
                          width={16}
                          height={16}
                          className="size-4 object-contain"
                        />
                      ) : null}
                      {agent.role}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-sm text-[var(--muted)] sm:px-5">
                    {agent.picks}
                  </td>
                  <td className="px-4 py-2.5 text-right sm:px-5">
                    <div className="ml-auto w-28">
                      <p className="font-display text-lg font-black">
                        {formatPercent(agent.pickRate)}
                      </p>
                      <div className="mt-1 h-1 bg-white/10">
                        <div
                          className="h-full bg-[var(--accent)]"
                          style={{ width: `${Math.min(100, agent.pickRate)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right font-display text-lg font-black sm:px-5">
                    {formatPercent(agent.winRate)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-sm sm:px-5">
                    {formatNumber(agent.kd, 2)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-sm sm:px-5">
                    {formatNumber(agent.averageAcs)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-sm sm:px-5">
                    {formatNumber(agent.averageDamagePerRound)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-sm sm:px-5">
                    {formatPercent(agent.headshotRate)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-sm sm:px-5">
                    {formatPercent(agent.kast)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <RouteLink
            href="/agents/meta"
            className="valorant-action inline-flex min-h-10 items-center border border-[var(--accent)] bg-[var(--accent)] px-4 text-[11px] font-black uppercase tracking-[0.12em]"
          >
            Full agent meta
          </RouteLink>
          <RouteLink
            href="/community"
            className="valorant-action inline-flex min-h-10 items-center border border-white/15 px-4 text-[11px] font-black uppercase tracking-[0.12em]"
          >
            Community favorites
          </RouteLink>
        </div>
      </section>

      <section className="border-t border-white/8 bg-[#0e141b]">
        <div className="mx-auto max-w-[86rem] px-4 py-9 sm:px-6 lg:px-8 lg:py-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow">Map intelligence</p>
              <h2 className="mt-3 font-display text-3xl font-black uppercase tracking-[-0.05em]">
                Maps and agent picks
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                See map frequency by queue and the agents most often selected
                on each battlefield.
              </p>
            </div>
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
              {mapMeta.totalMatches} matches / {mapMeta.modes.length} modes
            </p>
          </div>

          {mapPreviewRows.length > 0 ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {mapPreviewRows.map((map) => (
                <article
                  key={`${map.modeId}:${map.mapId}`}
                  className="grid grid-cols-[7rem_minmax(0,1fr)] overflow-hidden border border-white/10 bg-[var(--panel)]"
                >
                  <div className="relative min-h-24 bg-[#202832]">
                    {map.image ? (
                      <Image
                        src={map.image}
                        alt=""
                        fill
                        sizes="112px"
                        className="object-cover"
                      />
                    ) : null}
                    <div className="absolute inset-0 bg-black/25" />
                  </div>
                  <div className="p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--accent)]">
                      {map.mode}
                    </p>
                    <h3 className="mt-1 font-display text-xl font-black uppercase tracking-[-0.04em]">
                      {map.name}
                    </h3>
                    <p className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
                      {map.appearances} appearances / {formatPercent(map.appearanceRate)}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-6 border border-white/10 bg-[var(--panel)] p-5">
              <p className="font-display text-2xl font-black uppercase tracking-[-0.04em]">
                No map samples yet
              </p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Map frequency will appear after opt-in match data is synced.
              </p>
            </div>
          )}
          <RouteLink
            href="/maps/meta"
            className="valorant-action mt-4 inline-flex min-h-10 items-center border border-[var(--accent)] bg-[var(--accent)] px-4 text-[11px] font-black uppercase tracking-[0.12em]"
          >
            Explore map intelligence
          </RouteLink>
        </div>
      </section>
    </>
  );
}
