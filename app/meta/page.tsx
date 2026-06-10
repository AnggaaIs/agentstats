import type { Metadata } from "next";

import { AgentRoleLabel } from "@/components/agent-role-label";
import { PageHeading } from "@/components/page-heading";
import { createMetadata } from "@/lib/seo";
import { getAgents, getValorantVersion } from "@/lib/valorant-api";

const OFFICIAL_PATCH_NOTES_URL =
  "https://playvalorant.com/en-us/news/tags/patch-notes/";

export const metadata: Metadata = createMetadata({
  title: "Valorant Agent Meta & Current Patch",
  description:
    "Track the current Valorant patch, playable agent roster, role distribution, and AgentStats competitive data methodology.",
  path: "/meta",
});

export default async function MetaPage() {
  const [agents, version] = await Promise.all([
    getAgents(),
    getValorantVersion(),
  ]);
  const patchVersion = version.branch.replace("release-", "");
  const roleCounts = agents.reduce<
    Record<string, { count: number; icon: string | null }>
  >((counts, agent) => {
    const role = agent.role?.displayName ?? "Other";
    const current = counts[role] ?? {
      count: 0,
      icon: agent.role?.displayIcon ?? null,
    };
    current.count += 1;
    counts[role] = current;
    return counts;
  }, {});
  return (
    <main>
      <section className="grid-noise border-b border-white/8">
        <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
          <PageHeading
            eyebrow={`Live patch ${patchVersion}`}
            title="Agent meta"
            description="Patch context, roster structure, and the path toward trustworthy opt-in competitive insights."
          />

          <div className="mt-12 grid border border-white/10 sm:grid-cols-3">
            {[
              ["Current patch", patchVersion],
              ["Playable agents", agents.length.toString()],
              ["Roles", Object.keys(roleCounts).length.toString()],
            ].map(([label, value]) => (
              <div
                key={label}
                className="border-b border-white/10 p-5 last:border-b-0 sm:border-r lg:border-b-0"
              >
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--muted)]">
                  {label}
                </p>
                <p className="mt-2 font-display text-3xl font-black uppercase">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/8 bg-[#0e141b]">
        <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="eyebrow">Roster structure</p>
              <h2 className="mt-4 font-display text-4xl font-black uppercase tracking-[-0.045em]">
                Role distribution
              </h2>
              <p className="mt-5 max-w-lg leading-7 text-[var(--muted)]">
                This is roster share, not pick rate. It shows how the current
                playable agent pool is distributed across roles.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {Object.entries(roleCounts)
                .sort(([left], [right]) => left.localeCompare(right))
                .map(([role, details]) => (
                  <div
                    key={role}
                    className="border border-white/10 bg-[var(--panel)] p-5"
                  >
                    <div className="flex items-end justify-between gap-5">
                      <div>
                        <AgentRoleLabel
                          name={role}
                          icon={details.icon}
                          className="text-xs font-black uppercase tracking-[0.16em] text-[var(--muted)]"
                        />
                        <p className="mt-2 font-display text-4xl font-black">
                          {details.count}
                        </p>
                      </div>
                      <p className="font-mono text-sm text-[var(--accent)]">
                        {((details.count / agents.length) * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="mt-4 h-1 bg-white/10">
                      <div
                        className="h-full bg-[var(--accent)]"
                        style={{
                          width: `${(details.count / agents.length) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="grid gap-8 border border-white/10 bg-[var(--panel)] p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="eyebrow">Official game updates</p>
            <h2 className="mt-4 font-display text-4xl font-black uppercase tracking-[-0.045em]">
              Read patch {patchVersion} at Riot
            </h2>
            <p className="mt-4 max-w-2xl leading-7 text-[var(--muted)]">
              Balance changes, bug fixes, maps, weapons, and mode updates are
              maintained by Riot Games. AgentStats links to the original source
              instead of republishing or interpreting those notes.
            </p>
          </div>
          <a
            href={OFFICIAL_PATCH_NOTES_URL}
            target="_blank"
            rel="noreferrer"
            className="valorant-action inline-flex min-h-12 items-center justify-center border border-[var(--accent)] bg-[var(--accent)] px-6 text-sm font-black uppercase tracking-widest"
          >
            Open Riot patch notes
          </a>
        </div>
      </section>

      <section className="border-t border-white/8">
        <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="eyebrow">Competitive dataset</p>
              <h2 className="mt-4 font-display text-4xl font-black uppercase tracking-[-0.045em]">
                Pick rate is pending
              </h2>
              <p className="mt-5 max-w-lg leading-7 text-[var(--muted)]">
                Riot does not return a ready-made pick rate. AgentStats will
                calculate it from matches shared by players who opt in after
                production and Riot Sign On approval.
              </p>
            </div>
            <div className="grid gap-px border border-white/10 bg-white/10 sm:grid-cols-4">
              {[
                ["01", "Player opts in", "Riot Sign On verifies permission."],
                ["02", "Matches arrive", "Approved match records are collected."],
                ["03", "Data is grouped", "Patch, rank, map, mode, and region."],
                ["04", "Meta is published", "Only after a safe sample threshold."],
              ].map(([number, title, copy]) => (
                <article key={number} className="bg-[var(--panel)] p-5">
                  <p className="font-mono text-xs text-[var(--accent)]">{number}</p>
                  <h3 className="mt-8 font-display text-lg font-black uppercase">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    {copy}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
