import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { deleteTeam, leaveTeam } from "@/app/teams/actions";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import {
  MatchResult,
  ObservationScope,
  TeamRole,
} from "@/lib/generated/prisma/enums";
import { PLAYER_DATA_CONSENT_VERSION } from "@/lib/legal";
import { createMetadata } from "@/lib/seo";
import { getAgents } from "@/lib/valorant-api";

export const metadata: Metadata = createMetadata({
  title: "Team Workspace",
  description:
    "Review opted-in team aggregate performance and role coverage on AgentStats.",
  path: "/teams",
  noIndex: true,
});

interface TeamPageProps {
  params: Promise<{ teamId: string }>;
  searchParams: Promise<{ status?: string }>;
}

function statusMessage(status: string | undefined) {
  if (status === "created") return "Team created. Share the join code.";
  if (status === "joined") return "You joined this team workspace.";
  if (status === "owner-cannot-leave") {
    return "The owner must delete the workspace instead of leaving it.";
  }
  return null;
}

function aggregateMember(
  observations: Array<{
    agentId: string;
    result: MatchResult;
    roundsPlayed: number;
    score: number;
    kills: number;
    deaths: number;
    assists: number;
    damage: number;
    kastRounds: number;
  }>,
) {
  const totals = observations.reduce(
    (value, observation) => {
      value.rounds += observation.roundsPlayed;
      value.score += observation.score;
      value.kills += observation.kills;
      value.deaths += observation.deaths;
      value.assists += observation.assists;
      value.damage += observation.damage;
      value.kastRounds += observation.kastRounds;
      if (observation.result === MatchResult.WIN) value.wins += 1;
      value.agents.set(
        observation.agentId,
        (value.agents.get(observation.agentId) ?? 0) + 1,
      );
      return value;
    },
    {
      rounds: 0,
      score: 0,
      kills: 0,
      deaths: 0,
      assists: 0,
      damage: 0,
      kastRounds: 0,
      wins: 0,
      agents: new Map<string, number>(),
    },
  );
  const mainAgent =
    [...totals.agents.entries()].toSorted(
      (left, right) => right[1] - left[1],
    )[0]?.[0] ?? null;
  return {
    games: observations.length,
    rounds: totals.rounds,
    wins: totals.wins,
    winRate:
      observations.length === 0
        ? 0
        : (totals.wins / observations.length) * 100,
    acs: totals.rounds === 0 ? 0 : totals.score / totals.rounds,
    adr: totals.rounds === 0 ? 0 : totals.damage / totals.rounds,
    kast: totals.rounds === 0 ? 0 : (totals.kastRounds / totals.rounds) * 100,
    kd: totals.deaths === 0 ? totals.kills : totals.kills / totals.deaths,
    mainAgent,
  };
}

export default async function TeamPage({
  params,
  searchParams,
}: TeamPageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const [{ teamId }, query] = await Promise.all([params, searchParams]);

  const membership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: session.user.id } },
    select: { role: true },
  });
  if (!membership) notFound();

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              gameName: true,
              tagLine: true,
              region: true,
              consentVersion: true,
              consentedAt: true,
            },
          },
        },
        orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
      },
    },
  });
  if (!team) notFound();

  const consentedMemberIds = team.members
    .filter(
      (member) =>
        member.user.consentedAt &&
        member.user.consentVersion === PLAYER_DATA_CONSENT_VERSION,
    )
    .map((member) => member.userId);
  const [observations, agents] = await Promise.all([
    consentedMemberIds.length === 0
      ? Promise.resolve([])
      : prisma.agentMatchObservation.findMany({
          where: {
            sourceUserId: { in: consentedMemberIds },
            scope: ObservationScope.SELF,
          },
          select: {
            sourceUserId: true,
            agentId: true,
            result: true,
            roundsPlayed: true,
            score: true,
            kills: true,
            deaths: true,
            assists: true,
            damage: true,
            kastRounds: true,
          },
          orderBy: { matchStartedAt: "desc" },
          take: 400,
        }),
    getAgents().catch(() => []),
  ]);
  const agentNames = new Map(
    agents.map((agent) => [agent.uuid, agent.displayName]),
  );
  const observationsByMember = new Map<
    string,
    (typeof observations)[number][]
  >();
  for (const observation of observations) {
    const current = observationsByMember.get(observation.sourceUserId) ?? [];
    if (current.length < 20) current.push(observation);
    observationsByMember.set(observation.sourceUserId, current);
  }

  const memberRows = team.members.map((member) => {
    const stats = aggregateMember(
      observationsByMember.get(member.userId) ?? [],
    );
    return {
      ...member,
      stats,
      mainAgent: stats.mainAgent
        ? (agentNames.get(stats.mainAgent) ?? "Unknown agent")
        : "No sample",
    };
  });
  const teamObservations = memberRows.flatMap((member) =>
    observationsByMember.get(member.userId) ?? [],
  );
  const teamStats = aggregateMember(teamObservations);
  const notice = statusMessage(query.status);
  const isOwner = membership.role === TeamRole.OWNER;

  return (
    <article>
      <header className="grid-noise border-b border-white/8">
        <div className="mx-auto max-w-[86rem] px-4 py-9 sm:px-6 lg:px-8 lg:py-12">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="eyebrow">Team workspace</p>
              <h1 className="responsive-text mt-4 font-display text-[clamp(3rem,9vw,6.5rem)] font-black uppercase leading-[0.84] tracking-[-0.07em]">
                {team.name}
              </h1>
              <p className="mt-5 text-sm leading-6 text-[var(--muted)]">
                {team.members.length} opted-in members · up to 20 recent stored
                observations per member
              </p>
            </div>
            <Link
              href="/teams"
              className="valorant-action flex min-h-11 items-center border border-white/15 px-5 text-[10px] font-black uppercase tracking-[0.14em]"
            >
              All teams
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[86rem] gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        {notice ? (
          <p
            role="status"
            className="border border-[var(--accent)]/35 bg-[var(--accent)]/8 p-4 text-sm"
          >
            {notice}
          </p>
        ) : null}

        <section aria-labelledby="team-overview-title">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Shared sample</p>
              <h2
                id="team-overview-title"
                className="mt-3 font-display text-3xl font-black uppercase tracking-[-0.05em] sm:text-5xl"
              >
                Team overview
              </h2>
            </div>
            <p className="max-w-lg text-sm leading-6 text-[var(--muted)]">
              This is a comparison view, not a ranking. Different members may
              have different numbers of stored matches.
            </p>
          </div>
          <div className="mt-6 grid grid-cols-2 border-l border-t border-white/10 md:grid-cols-5">
            {[
              ["Matches", teamStats.games.toString()],
              ["Win rate", `${teamStats.winRate.toFixed(0)}%`],
              ["ACS", teamStats.acs.toFixed(0)],
              ["KAST", `${teamStats.kast.toFixed(1)}%`],
              ["ADR", teamStats.adr.toFixed(0)],
            ].map(([label, value]) => (
              <div
                key={label}
                className="border-b border-r border-white/10 bg-[var(--panel)] p-4 sm:p-5"
              >
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--muted)]">
                  {label}
                </p>
                <p className="mt-3 font-display text-3xl font-black">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <section
          aria-labelledby="members-title"
          className="border-t border-white/10 pt-8"
        >
          <p className="eyebrow">Roster</p>
          <h2
            id="members-title"
            className="mt-3 font-display text-3xl font-black uppercase tracking-[-0.05em] sm:text-5xl"
          >
            Member comparison
          </h2>
          <div className="tactical-scrollbar mt-6 overflow-x-auto border border-white/10">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead className="bg-white/5 text-[10px] font-black uppercase tracking-[0.16em] text-[var(--muted)]">
                <tr>
                  <th className="p-4">Player</th>
                  <th className="p-4">Main agent</th>
                  <th className="p-4">Sample</th>
                  <th className="p-4">Win</th>
                  <th className="p-4">ACS</th>
                  <th className="p-4">K/D</th>
                  <th className="p-4">KAST</th>
                </tr>
              </thead>
              <tbody>
                {memberRows.map((member) => (
                  <tr
                    key={member.id}
                    className="border-t border-white/8 transition hover:bg-white/[0.025]"
                  >
                    <td className="p-4">
                      <p className="font-black">
                        {member.user.gameName ?? "Connected player"}
                        {member.user.tagLine
                          ? `#${member.user.tagLine}`
                          : ""}
                      </p>
                      <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">
                        {member.role} · {member.user.region}
                      </p>
                    </td>
                    <td className="p-4 text-sm">{member.mainAgent}</td>
                    <td className="p-4 font-mono text-sm">
                      {member.stats.games}
                    </td>
                    <td className="p-4 font-mono text-sm">
                      {member.stats.winRate.toFixed(0)}%
                    </td>
                    <td className="p-4 font-mono text-sm">
                      {member.stats.acs.toFixed(0)}
                    </td>
                    <td className="p-4 font-mono text-sm">
                      {member.stats.kd.toFixed(2)}
                    </td>
                    <td className="p-4 font-mono text-sm">
                      {member.stats.kast.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-5 border-t border-white/10 pt-8 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="eyebrow">Access control</p>
            <h2 className="mt-3 font-display text-3xl font-black uppercase tracking-[-0.05em]">
              Membership is the permission
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)]">
              Leaving removes access immediately. Members whose current player
              data consent is inactive remain listed, but contribute no
              statistics.
            </p>
            {isOwner ? (
              <div className="mt-5 border border-[var(--accent)]/35 bg-[var(--accent)]/5 p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--accent)]">
                  Owner invite code
                </p>
                <p className="mt-3 font-mono text-2xl font-black tracking-[0.18em]">
                  {team.joinCode}
                </p>
                <p className="mt-2 text-xs text-[var(--muted)]">
                  Share this code only with people who should join the
                  workspace.
                </p>
              </div>
            ) : null}
          </div>
          <div className="grid min-w-56 content-end gap-3">
            {isOwner ? (
              <form action={deleteTeam} className="grid gap-3">
                <input type="hidden" name="teamId" value={team.id} />
                <label className="flex items-start gap-3 text-xs leading-5 text-[var(--muted)]">
                  <input
                    type="checkbox"
                    name="deleteConfirmation"
                    value="on"
                    required
                    className="mt-0.5 size-4 shrink-0 accent-[var(--accent)]"
                  />
                  Permanently delete this workspace and all memberships.
                </label>
                <button
                  type="submit"
                  className="valorant-action min-h-11 w-full border border-[var(--accent)] px-5 text-[10px] font-black uppercase tracking-[0.14em] text-[var(--accent)]"
                >
                  Delete workspace
                </button>
              </form>
            ) : (
              <form action={leaveTeam}>
                <input type="hidden" name="teamId" value={team.id} />
                <button
                  type="submit"
                  className="valorant-action min-h-11 w-full border border-[var(--accent)] px-5 text-[10px] font-black uppercase tracking-[0.14em] text-[var(--accent)]"
                >
                  Leave workspace
                </button>
              </form>
            )}
          </div>
        </section>
      </div>
    </article>
  );
}
