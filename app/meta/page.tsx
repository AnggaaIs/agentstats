import type { Metadata } from "next";

import { PageHeading } from "@/components/page-heading";
import { RouteLink } from "@/components/route-link";
import { REGIONS, type Region } from "@/lib/constants";
import { getPlatformStatus, getStatusText } from "@/lib/riot";
import { getAgents, getValorantVersion } from "@/lib/valorant-api";

const OFFICIAL_PATCH_NOTES_URL =
  "https://playvalorant.com/en-us/news/tags/patch-notes/";

export const metadata: Metadata = {
  title: "Agent Meta",
  description:
    "Track the current Valorant patch, agent roster, patch impact, and Riot service status.",
};

interface MetaPageProps {
  searchParams: Promise<{ region?: string }>;
}

function isRegion(value: string | undefined): value is Region {
  return REGIONS.some((region) => region === value);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function getSeverityClass(severity: string | null): string {
  if (severity === "critical") return "text-[var(--accent)]";
  if (severity === "warning") return "text-amber-300";
  return "text-emerald-300";
}

export default async function MetaPage({ searchParams }: MetaPageProps) {
  const requestedRegion = (await searchParams).region;
  const region: Region = isRegion(requestedRegion) ? requestedRegion : "ap";
  const [agents, version, statusResult] = await Promise.all([
    getAgents(),
    getValorantVersion(),
    getPlatformStatus(region)
      .then((value) => ({ value, error: null }))
      .catch((error: unknown) => ({
        value: null,
        error:
          error instanceof Error
            ? error.message
            : "Riot service status could not be loaded.",
      })),
  ]);
  const patchVersion = version.branch.replace("release-", "");
  const roleCounts = agents.reduce<Record<string, number>>((counts, agent) => {
    const role = agent.role?.displayName ?? "Other";
    counts[role] = (counts[role] ?? 0) + 1;
    return counts;
  }, {});
  const notices = statusResult.value
    ? [
        ...statusResult.value.incidents.map((notice) => ({
          ...notice,
          kind: "Incident" as const,
        })),
        ...statusResult.value.maintenances.map((notice) => ({
          ...notice,
          kind: "Maintenance" as const,
        })),
      ]
    : [];
  return (
    <main>
      <section className="grid-noise border-b border-white/8">
        <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
          <PageHeading
            eyebrow={`Live patch ${patchVersion}`}
            title="Agent meta"
            description="Patch impact, roster structure, and live Riot service notices in one operational view."
          />

          <div className="mt-12 grid border border-white/10 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Current patch", patchVersion],
              ["Playable agents", agents.length.toString()],
              ["Roles", Object.keys(roleCounts).length.toString()],
              [
                "Service notices",
                statusResult.value ? notices.length.toString() : "Unavailable",
              ],
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

      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="flex flex-col gap-5 border-b border-white/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="eyebrow">Riot platform status</p>
            <h2 className="mt-4 font-display text-4xl font-black uppercase tracking-[-0.045em]">
              {statusResult.value?.name ?? region.toUpperCase()}
            </h2>
          </div>
          <nav aria-label="Choose status region" className="flex flex-wrap gap-2">
            {REGIONS.map((item) => (
              <RouteLink
                key={item}
                href={`/meta?region=${item}`}
                current={item === region}
                className="valorant-action grid min-h-11 min-w-12 place-items-center border border-white/15 px-3 text-xs font-black uppercase tracking-widest"
              >
                {item}
              </RouteLink>
            ))}
          </nav>
        </div>

        {statusResult.value ? (
          notices.length ? (
            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              {notices.map((notice) => {
                const latestUpdate = notice.updates
                  .filter((update) => update.publish)
                  .at(-1);

                return (
                  <article
                    key={`${notice.kind}-${notice.id}`}
                    className="border-l-2 border-[var(--accent)] bg-[var(--panel)] p-6"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p
                        className={`text-xs font-black uppercase tracking-[0.16em] ${getSeverityClass(
                          notice.incident_severity,
                        )}`}
                      >
                        {notice.kind} ·{" "}
                        {notice.incident_severity ?? "scheduled"}
                      </p>
                      <p className="text-xs text-[var(--muted)]">
                        {formatDate(notice.created_at)}
                      </p>
                    </div>
                    <h3 className="mt-4 font-display text-2xl font-black uppercase">
                      {getStatusText(notice.titles)}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                      {latestUpdate
                        ? getStatusText(latestUpdate.translations)
                        : "Riot has not published an additional update."}
                    </p>
                    <p className="mt-5 text-xs font-bold uppercase tracking-widest text-[var(--muted)]">
                      {notice.platforms.join(" · ") || "All platforms"}
                    </p>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mt-8 border-l-2 border-emerald-400 bg-emerald-400/5 p-6">
              <p className="font-display text-2xl font-black uppercase">
                No active notices
              </p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Riot currently reports no incidents or scheduled maintenance
                for this region.
              </p>
            </div>
          )
        ) : (
          <div className="mt-8 border-l-2 border-amber-300 bg-amber-300/5 p-6">
            <p className="font-display text-2xl font-black uppercase">
              Status unavailable
            </p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {statusResult.error}
            </p>
          </div>
        )}
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
                .map(([role, count]) => (
                  <div
                    key={role}
                    className="border border-white/10 bg-[var(--panel)] p-5"
                  >
                    <div className="flex items-end justify-between gap-5">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--muted)]">
                          {role}
                        </p>
                        <p className="mt-2 font-display text-4xl font-black">
                          {count}
                        </p>
                      </div>
                      <p className="font-mono text-sm text-[var(--accent)]">
                        {((count / agents.length) * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="mt-4 h-1 bg-white/10">
                      <div
                        className="h-full bg-[var(--accent)]"
                        style={{ width: `${(count / agents.length) * 100}%` }}
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
