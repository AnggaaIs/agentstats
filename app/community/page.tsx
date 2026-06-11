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
  type CommunityLeaderboardCategory,
  type CommunityCount,
} from "@/lib/community";
import { createMetadata } from "@/lib/seo";
import { getAgents, getMaps, getWeapons } from "@/lib/valorant-api";

export const metadata: Metadata = createMetadata({
  title: "Valorant Community Favorites",
  description:
    "See the Valorant agents, maps, weapons, and skins selected as favorites by the AgentStats community, with verified anonymous vote rankings.",
  path: "/community",
});

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

  const boards: Record<
    CommunityLeaderboardCategory,
    CommunityLeaderboardRow[]
  > = {
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
    skin: buildRows(
      weapons.flatMap((weapon) =>
        weapon.skins.flatMap((skin) =>
          skin.displayIcon
            ? [
                {
                  id: skin.uuid,
                  name: skin.displayName,
                  image: skin.displayIcon,
                  meta: `${weapon.displayName} skin`,
                  scopeKey: weapon.uuid,
                  href: `/weapons/${weapon.uuid}/skins/${skin.uuid}`,
                },
              ]
            : [],
        ),
      ),
      overview.counts.skin,
    ),
  };
  const totals = {
    agent: overview.counts.agent.reduce((sum, item) => sum + item.votes, 0),
    map: overview.counts.map.reduce((sum, item) => sum + item.votes, 0),
    weapon: overview.counts.weapon.reduce((sum, item) => sum + item.votes, 0),
    skin: overview.counts.skin.reduce((sum, item) => sum + item.votes, 0),
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
  const skinGroups = weapons
    .map((weapon) => ({
      label: weapon.displayName,
      scopeKey: weapon.uuid,
      total: overview.counts.skin
        .filter((count) => count.scopeKey === weapon.uuid)
        .reduce((sum, count) => sum + count.votes, 0),
    }))
    .filter((weapon) => weapon.total > 0)
    .sort(
      (left, right) =>
        right.total - left.total || left.label.localeCompare(right.label),
    );

  return (
    <section className="mx-auto max-w-[86rem] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <PageHeading
        eyebrow="Community favorites"
        title="The community decides"
        description="Choose one agent for each role, one map, one weapon, and one skin per weapon. Rankings are built from verified anonymous choices."
      />

      <CommunityLeaderboard
        boards={boards}
        totals={totals}
        agentRoles={agentRoles}
        agentTotals={agentTotals}
        skinGroups={skinGroups}
        initialFavorites={favorites}
        participants={overview.participants}
        totalChoices={overview.totalVotes}
      />

      <section className="mt-9 grid gap-5 border-t border-white/8 pt-8 lg:grid-cols-[1fr_0.7fr]">
        <div>
          <p className="eyebrow">Fair voting</p>
          <h2 className="mt-4 font-display text-3xl font-black uppercase tracking-[-0.05em]">
            One active choice per category
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)]">
            No account is required. AgentStats gives this browser an anonymous,
            protected identifier. Each agent role has its own choice, while
            maps and weapons keep one choice each, and every weapon has its own
            favorite skin slot. Unusual bursts and repeated changes are
            temporarily limited.
          </p>
        </div>
        <ClearCommunityFavorites />
      </section>
    </section>
  );
}
