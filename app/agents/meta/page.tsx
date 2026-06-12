import type { Metadata } from "next";
import Image from "next/image";

import { PageHeading } from "@/components/page-heading";
import { RouteLink } from "@/components/route-link";
import {
  AGENT_META_QUEUES,
  AGENT_RANK_BUCKETS,
  type AgentRankBucket,
  type AgentRankBucketId,
  buildEmptyAgentMetaDataset,
  getAgentMetaDataset,
  getAgentRankMetaDataset,
} from "@/lib/agent-meta";
import { getCompetitiveTier } from "@/lib/rank-distribution";
import { createMetadata } from "@/lib/seo";
import {
  getAgents,
  getCompetitiveTiers,
  getCurrentAct,
} from "@/lib/valorant-api";

export const metadata: Metadata = createMetadata({
  title: "Valorant Agent Pick Rates & Meta Stats",
  description:
    "Explore AgentStats agent pick rate, win rate, K/D, ACS, ADR, headshot rate, KAST, damage delta, and first blood statistics from opt-in match data.",
  path: "/agents/meta",
});

function formatNumber(value: number, digits = 0): string {
  return value.toFixed(digits);
}

function formatPercent(value: number, digits = 1): string {
  return `${formatNumber(value, digits)}%`;
}

interface AgentMetaPageProps {
  searchParams: Promise<{ mode?: string; rank?: string; role?: string }>;
}

function isRankBucket(value: string | undefined): value is AgentRankBucketId {
  return AGENT_RANK_BUCKETS.some((bucket) => bucket.id === value);
}

export default async function AgentMetaPage({
  searchParams,
}: AgentMetaPageProps) {
  const query = await searchParams;
  const selectedMode = AGENT_META_QUEUES.some(
    (queue) => queue.id === query.mode,
  )
    ? query.mode!
    : "competitive";
  const hasRankFilter = selectedMode === "competitive";
  const selectedRank =
    hasRankFilter && isRankBucket(query.rank) ? query.rank : "all";
  const [agents, currentAct, tiers] = await Promise.all([
    getAgents(),
    getCurrentAct().catch(() => null),
    getCompetitiveTiers().catch(() => []),
  ]);
  const [agentMeta, rankMeta] = await Promise.all([
    getAgentMetaDataset(agents, currentAct?.uuid, {
      queueId: selectedMode,
      rankBucket: selectedRank,
    }).catch(() => buildEmptyAgentMetaDataset(agents)),
    hasRankFilter
      ? getAgentRankMetaDataset(
          agents,
          currentAct?.uuid,
          selectedMode,
        ).catch(() => [])
      : Promise.resolve([]),
  ]);
  const roles = [
    ...new Set(agentMeta.rows.map((agent) => agent.role)),
  ].sort();
  const roleIcons = Object.fromEntries(
    agentMeta.rows.flatMap((agent) =>
      agent.roleIcon ? [[agent.role, agent.roleIcon]] : [],
    ),
  );
  const selectedRole = roles.includes(query.role ?? "")
    ? query.role!
    : "all";
  const visibleRows =
    selectedRole === "all"
      ? agentMeta.rows
      : agentMeta.rows.filter((agent) => agent.role === selectedRole);
  const selectedModeLabel =
    AGENT_META_QUEUES.find((queue) => queue.id === selectedMode)?.label ??
    selectedMode;
  const selectedRankLabel =
    AGENT_RANK_BUCKETS.find((bucket) => bucket.id === selectedRank)?.label ??
    "All ranks";

  function metaHref(next: {
    mode?: string;
    rank?: AgentRankBucketId;
    role?: string;
  }): string {
    const params = new URLSearchParams();
    const mode = next.mode ?? selectedMode;
    const rank = mode === "competitive" ? next.rank ?? selectedRank : "all";
    const role = next.role ?? selectedRole;

    if (mode !== "competitive") params.set("mode", mode);
    if (rank !== "all") params.set("rank", rank);
    if (role !== "all") params.set("role", role);

    const search = params.toString();
    return search ? `/agents/meta?${search}` : "/agents/meta";
  }

  function getRankBucketIcon(bucket: AgentRankBucket): string | null {
    const representativeTier = bucket.tiers.at(-1) ?? 0;
    return getCompetitiveTier(representativeTier, tiers).icon;
  }

  return (
    <section className="mx-auto max-w-[86rem] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <PageHeading
          eyebrow={currentAct?.displayLabel ?? "Agent meta"}
          title="Agent pick rates"
          description="Agent pick rate by mode and role. Competitive also reveals which agents lead each rank."
        />
        <div className="flex flex-wrap gap-2">
          <RouteLink
            href="/"
            className="valorant-action inline-flex min-h-10 items-center border border-white/15 px-4 text-[11px] font-black uppercase tracking-[0.12em]"
          >
            Back home
          </RouteLink>
          <RouteLink
            href="/agents"
            className="valorant-action inline-flex min-h-10 items-center border border-[var(--accent)] bg-[var(--accent)] px-4 text-[11px] font-black uppercase tracking-[0.12em]"
          >
            Browse agents
          </RouteLink>
        </div>
      </div>

      <div className="mt-7 grid border border-white/10 bg-[var(--panel)] sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Tracked players", agentMeta.trackedPlayers.toString()],
          ["Sample matches", agentMeta.totalMatches.toString()],
          ["Agent picks", agentMeta.totalPicks.toString()],
          [
            "View",
            hasRankFilter
              ? `${selectedModeLabel} / ${selectedRankLabel}`
              : selectedModeLabel,
          ],
        ].map(([label, value]) => (
          <div key={label} className="border-white/10 p-5 sm:border-l first:border-l-0">
            <p className="font-display text-3xl font-black tracking-[-0.05em]">
              {value}
            </p>
            <p className="mt-1 text-xs font-black uppercase tracking-[0.16em] text-[var(--muted)]">
              {label}
            </p>
          </div>
        ))}
      </div>

      <div className="tactical-scrollbar mt-6 grid grid-flow-col auto-cols-max gap-2 overflow-x-auto border border-white/10 p-2 sm:flex sm:flex-wrap">
        {AGENT_META_QUEUES.map((queue) => (
          <RouteLink
            key={queue.id}
            href={metaHref({ mode: queue.id })}
            current={selectedMode === queue.id}
            className="valorant-action flex min-h-11 shrink-0 items-center px-4 text-[10px] font-black uppercase tracking-[0.13em]"
          >
            {queue.label}
          </RouteLink>
        ))}
      </div>

      {hasRankFilter ? (
        <div className="tactical-scrollbar mt-3 grid grid-flow-col auto-cols-max gap-2 overflow-x-auto border border-white/10 p-2 sm:flex sm:flex-wrap">
          {AGENT_RANK_BUCKETS.map((bucket) => {
            const icon = getRankBucketIcon(bucket);

            return (
              <RouteLink
                key={bucket.id}
                href={metaHref({ rank: bucket.id })}
                current={selectedRank === bucket.id}
                className="valorant-action flex min-h-11 shrink-0 items-center gap-2 px-4 text-[10px] font-black uppercase tracking-[0.13em]"
              >
                {icon ? (
                  <Image
                    src={icon}
                    alt=""
                    width={20}
                    height={20}
                    className="size-5 object-contain"
                  />
                ) : null}
                {bucket.label}
              </RouteLink>
            );
          })}
        </div>
      ) : null}

      <div className="tactical-scrollbar mt-3 grid grid-flow-col auto-cols-max gap-2 overflow-x-auto border border-white/10 p-2 sm:flex sm:flex-wrap">
        <RouteLink
          href={metaHref({ role: "all" })}
          current={selectedRole === "all"}
          className="valorant-action flex min-h-11 shrink-0 items-center px-4 text-[10px] font-black uppercase tracking-[0.13em]"
        >
          All roles
        </RouteLink>
        {roles.map((role) => (
          <RouteLink
            key={role}
            href={metaHref({ role })}
            current={selectedRole === role}
            className="valorant-action flex min-h-11 shrink-0 items-center gap-2 px-4 text-[10px] font-black uppercase tracking-[0.13em]"
          >
            {roleIcons[role] ? (
              <Image
                src={roleIcons[role]}
                alt=""
                width={18}
                height={18}
                className="size-5 object-contain"
              />
            ) : null}
            {role}
          </RouteLink>
        ))}
      </div>

      {hasRankFilter ? (
        <section className="mt-6 border border-white/10 bg-[#0e141b]">
          <div className="flex flex-col gap-2 border-b border-white/8 p-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow">Rank-specific meta</p>
              <h2 className="mt-2 font-display text-2xl font-black uppercase tracking-[-0.04em]">
                Most picked agents by rank
              </h2>
              <p className="mt-2 max-w-2xl text-xs leading-5 text-[var(--muted)]">
                Shows the overall agent leaders in each rank bucket. Pick rate
                is calculated within that rank, so Gold and Diamond can be
                compared directly.
              </p>
            </div>
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
              {rankMeta.length} ranks with samples
            </p>
          </div>
          {rankMeta.length > 0 ? (
            <div className="grid gap-px bg-white/10 md:grid-cols-2 xl:grid-cols-3">
              {rankMeta.map((row) => {
              const bucket = AGENT_RANK_BUCKETS.find(
                (item) => item.id === row.bucketId,
              );
              const icon = bucket ? getRankBucketIcon(bucket) : null;

              return (
                <article
                  key={row.bucketId}
                  className="bg-[var(--panel)] p-4"
                >
                  <div className="flex items-center justify-between gap-3 border-b border-white/8 pb-3">
                    <div className="flex items-center gap-3">
                      {icon ? (
                        <Image
                          src={icon}
                          alt=""
                          width={34}
                          height={34}
                          className="size-9 object-contain"
                        />
                      ) : null}
                      <div>
                        <p className="font-display text-xl font-black uppercase tracking-[-0.04em]">
                          {row.label}
                        </p>
                        <p className="mt-0.5 text-[9px] uppercase tracking-[0.12em] text-[var(--muted)]">
                          {row.samplePicks} player picks
                        </p>
                      </div>
                    </div>
                    <RouteLink
                      href={metaHref({ rank: row.bucketId, role: "all" })}
                      className="valorant-action border border-white/12 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.12em]"
                    >
                      View table
                    </RouteLink>
                  </div>
                  <div className="mt-3 grid gap-2">
                    {row.leaders.map((leader, index) => (
                      <div
                        key={leader.agentId}
                        className="grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3 border border-white/8 bg-black/10 p-2.5"
                      >
                        <span className="font-mono text-xs text-white/35">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <div className="flex min-w-0 items-center gap-2.5">
                          {leader.icon ? (
                            <Image
                              src={leader.icon}
                              alt=""
                              width={32}
                              height={32}
                              className="size-8 shrink-0 bg-white/5 object-cover"
                            />
                          ) : null}
                          <div className="min-w-0">
                            <p className="responsive-text font-black uppercase">
                              {leader.name}
                            </p>
                            <p className="mt-0.5 text-[9px] uppercase tracking-[0.1em] text-[var(--muted)]">
                              {leader.picks} picks ·{" "}
                              {formatPercent(leader.winRate)} WR
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-display text-xl font-black text-[var(--accent)]">
                            {formatPercent(leader.pickRate)}
                          </p>
                          <p className="text-[8px] uppercase tracking-wider text-[var(--muted)]">
                            pick rate
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {row.samplePicks < 20 ? (
                    <p className="mt-3 text-[9px] leading-4 text-amber-200/75">
                      Small sample: treat this rank insight as directional.
                    </p>
                  ) : null}
                </article>
              );
              })}
            </div>
          ) : (
            <div className="p-5 text-sm leading-6 text-[var(--muted)]">
              No competitive rank samples are available for this act yet.
              Agent leaders will appear after opt-in matches are synced.
            </div>
          )}
        </section>
      ) : null}

      <div
        role="region"
        aria-label="Full agent meta table"
        tabIndex={0}
        className="tactical-scrollbar mt-6 overflow-x-auto border border-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
      >
        <table className="w-full min-w-[78rem] border-collapse text-left">
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
              <th className="px-4 py-3 text-right sm:px-5">DDΔ</th>
              <th className="px-4 py-3 text-right sm:px-5">HS%</th>
              <th className="px-4 py-3 text-right sm:px-5">KAST</th>
              <th className="px-4 py-3 text-right sm:px-5">FB/m</th>
              <th className="px-4 py-3 text-right sm:px-5">Rounds</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((agent) => (
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
                  {formatNumber(agent.damageDeltaPerRound)}
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-sm sm:px-5">
                  {formatPercent(agent.headshotRate)}
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-sm sm:px-5">
                  {formatPercent(agent.kast)}
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-sm sm:px-5">
                  {formatNumber(agent.firstBloodsPerMatch, 2)}
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-sm sm:px-5">
                  {agent.rounds}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
