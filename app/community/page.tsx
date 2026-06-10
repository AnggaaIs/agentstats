import type { Metadata } from "next";

import {
  CommunityLeaderboard,
  type CommunityLeaderboardRow,
} from "@/components/community-leaderboard";
import { ClearCommunityFavorites } from "@/components/clear-community-favorites";
import { PageHeading } from "@/components/page-heading";
import {
  getCommunityOverview,
  getCurrentFavorites,
  toFavoriteScope,
  type CommunityCount,
  type FavoriteCategoryName,
} from "@/lib/community";
import { getAgents, getMaps, getWeapons } from "@/lib/valorant-api";

export const metadata: Metadata = {
  title: "Community Favorites",
  description:
    "See the Valorant agents, maps, and weapons chosen by the AgentStats community.",
};

export const dynamic = "force-dynamic";

function buildRows(
  items: Array<{
    id: string;
    name: string;
    image: string;
    meta: string;
    metaIcon?: string;
    scopeKey: string;
    href?: string;
  }>,
  counts: CommunityCount[],
): CommunityLeaderboardRow[] {
  const voteMap = new Map(counts.map((item) => [item.targetId, item.votes]));
  const totalsByScope = new Map<string, number>();
  for (const count of counts) {
    totalsByScope.set(
      count.scopeKey,
      (totalsByScope.get(count.scopeKey) ?? 0) + count.votes,
    );
  }

  return items
    .map((item) => {
      const votes = voteMap.get(item.id) ?? 0;
      const total = totalsByScope.get(item.scopeKey) ?? 0;
      return {
        ...item,
        votes,
        percentage: total ? Math.round((votes / total) * 100) : 0,
      };
    })
    .filter((item) => item.votes > 0)
    .sort(
      (left, right) =>
        right.votes - left.votes || left.name.localeCompare(right.name),
    );
}

export default async function CommunityPage() {
  const [agents, maps, weapons, overview, favorites] = await Promise.all([
    getAgents(),
    getMaps(),
    getWeapons(),
    getCommunityOverview(),
    getCurrentFavorites(),
  ]);

  const boards: Record<FavoriteCategoryName, CommunityLeaderboardRow[]> = {
    agent: buildRows(
      agents.map((agent) => ({
        id: agent.uuid,
        name: agent.displayName,
        image: agent.displayIcon,
        meta: agent.role?.displayName ?? "Agent",
        metaIcon: agent.role?.displayIcon,
        scopeKey: toFavoriteScope(agent.role?.displayName ?? "other"),
        href: `/agents/${agent.uuid}`,
      })),
      overview.counts.agent,
    ),
    map: buildRows(
      maps.map((map) => ({
        id: map.uuid,
        name: map.displayName,
        image: map.displayIcon ?? map.splash,
        meta: map.tacticalDescription ?? "Valorant map",
        scopeKey: "default",
      })),
      overview.counts.map,
    ),
    weapon: buildRows(
      weapons.map((weapon) => ({
        id: weapon.uuid,
        name: weapon.displayName,
        image: weapon.displayIcon,
        meta: weapon.shopData?.category ?? "Weapon",
        scopeKey: "default",
        href: `/weapons/${weapon.uuid}`,
      })),
      overview.counts.weapon,
    ),
  };
  const totals = {
    agent: overview.counts.agent.reduce((sum, item) => sum + item.votes, 0),
    map: overview.counts.map.reduce((sum, item) => sum + item.votes, 0),
    weapon: overview.counts.weapon.reduce((sum, item) => sum + item.votes, 0),
  };
  const agentRoles = ["Controller", "Duelist", "Initiator", "Sentinel"].map(
    (label) => ({
      label,
      scopeKey: toFavoriteScope(label),
      icon: agents.find((agent) => agent.role?.displayName === label)?.role
        ?.displayIcon,
    }),
  );
  const agentTotals = Object.fromEntries(
    agentRoles.map((role) => [
      role.scopeKey,
      overview.counts.agent
        .filter((count) => count.scopeKey === role.scopeKey)
        .reduce((sum, count) => sum + count.votes, 0),
    ]),
  );

  return (
    <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
      <PageHeading
        eyebrow="Community favorites"
        title="The community decides"
        description="Choose one agent for each role, plus one map and one weapon. Rankings are built from verified anonymous choices."
      />

      <div className="mt-10 grid border border-white/10 sm:grid-cols-2">
        <div className="border-b border-white/10 p-6 sm:border-b-0 sm:border-r">
          <p className="text-xs font-black uppercase tracking-[0.15em] text-[var(--muted)]">
            Participants
          </p>
          <p className="mt-2 font-display text-5xl font-black">
            {overview.participants}
          </p>
        </div>
        <div className="p-6">
          <p className="text-xs font-black uppercase tracking-[0.15em] text-[var(--muted)]">
            Active choices
          </p>
          <p className="mt-2 font-display text-5xl font-black">
            {overview.totalVotes}
          </p>
        </div>
      </div>

      <CommunityLeaderboard
        boards={boards}
        totals={totals}
        agentRoles={agentRoles}
        agentTotals={agentTotals}
        initialFavorites={favorites}
      />

      <section className="mt-16 grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <div>
          <p className="eyebrow">Fair voting</p>
          <h2 className="mt-5 font-display text-4xl font-black uppercase tracking-[-0.05em]">
            One active choice per role
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)]">
            No account is required. AgentStats gives this browser an anonymous,
            protected identifier. Each agent role has its own choice, while
            maps and weapons keep one choice each. Unusual bursts and repeated
            changes are temporarily limited.
          </p>
        </div>
        <ClearCommunityFavorites />
      </section>
    </section>
  );
}
