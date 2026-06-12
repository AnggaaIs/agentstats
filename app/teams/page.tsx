import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { createTeam, joinTeam } from "@/app/teams/actions";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Team Workspaces",
  description:
    "Create an opt-in AgentStats team workspace for shared aggregate performance review.",
  path: "/teams",
  noIndex: true,
});

interface TeamsPageProps {
  searchParams: Promise<{ status?: string }>;
}

function getStatusMessage(status: string | undefined) {
  if (status === "left") return "You left the team workspace.";
  if (status === "deleted") return "Team workspace deleted.";
  if (status === "team-not-found") return "No team matched that join code.";
  if (status === "invalid-code") return "Enter a valid team join code.";
  if (status === "invalid-team") return "Team name must be 3 to 48 characters.";
  return null;
}

export default async function TeamsPage({ searchParams }: TeamsPageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [memberships, query] = await Promise.all([
    prisma.teamMember.findMany({
      where: { userId: session.user.id },
      include: {
        team: {
          include: {
            _count: { select: { members: true } },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    }),
    searchParams,
  ]);
  const notice = getStatusMessage(query.status);

  return (
    <article>
      <header className="grid-noise border-b border-white/8">
        <div className="mx-auto max-w-[86rem] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <p className="eyebrow">Opt-in collaboration</p>
          <h1 className="responsive-text mt-4 max-w-5xl font-display text-[clamp(3rem,10vw,7rem)] font-black uppercase leading-[0.82] tracking-[-0.075em]">
            Review together.
            <span className="block text-[var(--accent)]">Keep control.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-sm leading-7 text-[var(--muted)] sm:text-base">
            Team workspaces compare aggregate performance for members who
            explicitly join. Journals, reports, raw matches, and Riot IDs
            outside the workspace are not shared.
          </p>
        </div>
      </header>

      <div className="mx-auto grid max-w-[86rem] gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[0.72fr_1.28fr] lg:px-8 lg:py-12">
        <div className="grid content-start gap-5">
          {notice ? (
            <p
              role="status"
              className="border border-[var(--accent)]/35 bg-[var(--accent)]/8 p-4 text-sm"
            >
              {notice}
            </p>
          ) : null}

          <section className="border border-white/10 bg-[var(--panel)] p-5 sm:p-6">
            <p className="eyebrow">Create</p>
            <h2 className="mt-3 font-display text-3xl font-black uppercase tracking-[-0.05em]">
              New workspace
            </h2>
            <form action={createTeam} className="mt-5 grid gap-4">
              <label className="grid gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--muted)]">
                  Team name
                </span>
                <input
                  name="name"
                  minLength={3}
                  maxLength={48}
                  placeholder="Premier roster"
                  required
                  className="min-h-11 border border-white/15 bg-[var(--ink)] px-3 text-sm"
                />
              </label>
              <button
                type="submit"
                className="valorant-action min-h-11 bg-[var(--accent)] px-4 text-[11px] font-black uppercase tracking-[0.14em]"
              >
                Create team
              </button>
            </form>
          </section>

          <section className="border border-white/10 p-5 sm:p-6">
            <p className="eyebrow">Join</p>
            <h2 className="mt-3 font-display text-3xl font-black uppercase tracking-[-0.05em]">
              Use an invite code
            </h2>
            <form action={joinTeam} className="mt-5 grid gap-4">
              <label className="grid gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--muted)]">
                  Join code
                </span>
                <input
                  name="joinCode"
                  minLength={6}
                  maxLength={20}
                  autoCapitalize="characters"
                  autoComplete="off"
                  placeholder="AB12CD34"
                  required
                  className="min-h-11 border border-white/15 bg-[var(--ink)] px-3 font-mono text-sm uppercase tracking-[0.16em]"
                />
              </label>
              <button
                type="submit"
                className="valorant-action min-h-11 border border-white/15 px-4 text-[11px] font-black uppercase tracking-[0.14em]"
              >
                Join workspace
              </button>
            </form>
          </section>

          <Link
            href="/improve"
            className="valorant-action flex min-h-14 items-center justify-between border border-white/15 px-5 text-xs font-black uppercase tracking-[0.14em]"
          >
            Back to personal review
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        <section aria-labelledby="workspaces-title">
          <p className="eyebrow">Your teams</p>
          <h2
            id="workspaces-title"
            className="mt-3 font-display text-3xl font-black uppercase tracking-[-0.05em] sm:text-5xl"
          >
            Active workspaces
          </h2>
          <div className="mt-6 grid gap-4">
            {memberships.length === 0 ? (
              <div className="border border-dashed border-white/15 p-8 sm:p-10">
                <p className="font-display text-2xl font-black uppercase">
                  No team yet
                </p>
                <p className="mt-3 max-w-lg text-sm leading-7 text-[var(--muted)]">
                  Create a workspace for your roster or join one with a code
                  from its owner.
                </p>
              </div>
            ) : (
              memberships.map((membership, index) => (
                <Link
                  key={membership.id}
                  href={`/teams/${membership.team.id}`}
                  className="valorant-panel group grid gap-5 p-5 pl-7 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-6 sm:pl-9"
                >
                  <span className="font-mono text-xs text-[var(--muted)]">
                    0{index + 1}
                  </span>
                  <div>
                    <h3 className="font-display text-3xl font-black uppercase tracking-[-0.045em]">
                      {membership.team.name}
                    </h3>
                    <p className="mt-2 text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                      {membership.team._count.members} members ·{" "}
                      {membership.role}
                    </p>
                  </div>
                  <span className="text-2xl text-[var(--accent)]" aria-hidden>
                    →
                  </span>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>
    </article>
  );
}
