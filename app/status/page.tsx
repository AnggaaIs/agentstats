import type { Metadata } from "next";

import { PageHeading } from "@/components/page-heading";
import { REGIONS, type Region } from "@/lib/constants";
import {
  getPlatformStatus,
  getStatusText,
  isActiveStatusNotice,
  type RiotPlatformStatus,
  type RiotStatusNotice,
} from "@/lib/riot";
import { createMetadata } from "@/lib/seo";

const OFFICIAL_RIOT_STATUS_URL = "https://status.riotgames.com/";

const REGION_NAMES: Record<Region, string> = {
  ap: "Asia Pacific",
  na: "North America",
  eu: "Europe",
  kr: "Korea",
  br: "Brazil",
  latam: "Latin America",
};

export const metadata: Metadata = createMetadata({
  title: "Valorant Server Status & Incidents",
  description:
    "Check current Valorant server incidents and scheduled maintenance across Asia Pacific, North America, Europe, Korea, Brazil, and LATAM.",
  path: "/status",
});

interface RegionStatus {
  region: Region;
  value: RiotPlatformStatus | null;
  error: string | null;
  notices: Array<RiotStatusNotice & { kind: "Incident" | "Maintenance" }>;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
    timeZoneName: "short",
  }).format(new Date(value));
}

function getSeverityClass(severity: string | null): string {
  if (severity === "critical") return "text-[var(--accent)]";
  if (severity === "warning") return "text-amber-300";
  return "text-sky-300";
}

function getLatestUpdate(notice: RiotStatusNotice) {
  return notice.updates.filter((update) => update.publish).at(-1);
}

async function getAllRegionStatuses(): Promise<RegionStatus[]> {
  return Promise.all(
    REGIONS.map(async (region) => {
      try {
        const value = await getPlatformStatus(region);
        const notices = [
          ...value.incidents.map((notice) => ({
            ...notice,
            kind: "Incident" as const,
          })),
          ...value.maintenances.map((notice) => ({
            ...notice,
            kind: "Maintenance" as const,
          })),
        ]
          .filter((notice) => isActiveStatusNotice(notice))
          .sort(
            (left, right) =>
              new Date(right.created_at).getTime() -
              new Date(left.created_at).getTime(),
          );

        return { region, value, error: null, notices };
      } catch (error) {
        return {
          region,
          value: null,
          error:
            error instanceof Error
              ? error.message
              : "Riot service status could not be loaded.",
          notices: [],
        };
      }
    }),
  );
}

export default async function StatusPage() {
  const statuses = await getAllRegionStatuses();
  const affected = statuses.filter(
    (status) => status.notices.length > 0,
  ).length;
  const unavailable = statuses.filter((status) => !status.value).length;
  const operational = statuses.length - affected - unavailable;

  return (
    <main>
      <section className="grid-noise border-b border-white/8">
        <div className="mx-auto max-w-[86rem] px-4 py-9 sm:px-6 lg:px-8 lg:py-11">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <PageHeading
              eyebrow="Riot service monitor"
              title="Platform status"
              description="Check current Valorant incidents and scheduled maintenance across all supported regions."
            />
            <a
              href={OFFICIAL_RIOT_STATUS_URL}
              target="_blank"
              rel="noreferrer"
              className="valorant-action inline-flex min-h-10 max-w-full items-center justify-center border border-white/15 px-4 text-[11px] font-black uppercase tracking-[0.12em]"
            >
              Open official Riot status
              <svg
                aria-hidden="true"
                viewBox="0 0 16 16"
                className="ml-3 size-3 fill-none stroke-[var(--accent)] stroke-2"
              >
                <path d="M6 3h7v7M13 3 5 11" />
                <path d="M11 9v4H3V5h4" />
              </svg>
            </a>
          </div>

          <dl className="mt-7 grid border border-white/10 sm:grid-cols-3">
            {[
              ["Operational", operational, "text-emerald-300"],
              ["With notices", affected, "text-amber-300"],
              ["Unavailable", unavailable, "text-[var(--accent)]"],
            ].map(([label, value, color]) => (
              <div
                key={label}
                className="flex items-center justify-between gap-5 border-b border-white/10 px-5 py-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"
              >
                <dt className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--muted)]">
                  {label}
                </dt>
                <dd className={`font-mono text-xl font-bold ${color}`}>
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-[86rem] overflow-x-hidden px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <p className="eyebrow">All regions</p>
            <h2 className="mt-3 font-display text-2xl font-black uppercase tracking-[-0.04em] sm:text-3xl">
              Valorant servers
            </h2>
          </div>
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
            Updated from Riot every 60 seconds
          </p>
        </div>

        <div className="grid gap-3">
          {statuses.map((status, index) => {
            const isUnavailable = !status.value;
            const hasNotices = status.notices.length > 0;
            const stateLabel = isUnavailable
              ? "Unavailable"
              : hasNotices
                ? `${status.notices.length} active ${
                    status.notices.length === 1 ? "notice" : "notices"
                  }`
                : "Operational";
            const stateClass = isUnavailable
              ? "text-[var(--accent)]"
              : hasNotices
                ? "text-amber-300"
                : "text-emerald-300";

            return (
              <details
                key={status.region}
                open={isUnavailable || hasNotices}
                className="group motion-card min-w-0 border border-white/10 bg-[var(--panel)] open:border-white/20"
                style={{ animationDelay: `${Math.min(index * 45, 180)}ms` }}
              >
                <summary className="valorant-action flex cursor-pointer list-none flex-col gap-3 p-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] group-open:border-b group-open:border-white/10 sm:flex-row sm:items-center sm:justify-between sm:gap-5 [&::-webkit-details-marker]:hidden">
                  <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                    <span className="grid size-11 shrink-0 place-items-center border border-white/12 bg-white/[0.035] font-mono text-xs font-black uppercase text-[var(--accent)]">
                      {status.region}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--muted)]">
                        Riot platform
                      </p>
                      <h3 className="responsive-text mt-1 font-display text-[clamp(1.25rem,7vw,1.5rem)] font-black uppercase leading-none tracking-[-0.035em]">
                        {status.value?.name ?? REGION_NAMES[status.region]}
                      </h3>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4 sm:shrink-0 sm:justify-end">
                    <p
                      className={`text-left text-[10px] font-black uppercase tracking-[0.14em] sm:text-right ${stateClass}`}
                    >
                      <span
                        aria-hidden="true"
                        className="mr-2 inline-block size-1.5 bg-current align-middle"
                      />
                      {stateLabel}
                    </p>
                    <span
                      aria-hidden="true"
                      className="grid size-9 shrink-0 place-items-center border border-white/12 text-[var(--muted)] transition duration-200 group-open:rotate-180 group-open:border-[var(--accent)] group-open:text-white"
                    >
                      <svg
                        viewBox="0 0 16 16"
                        className="size-3 fill-none stroke-current stroke-2"
                      >
                        <path d="m3 6 5 5 5-5" />
                      </svg>
                    </span>
                  </div>
                </summary>

                {isUnavailable ? (
                  <div className="p-5 sm:p-6">
                    <p className="font-display text-xl font-black uppercase">
                      Status feed unavailable
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                      {status.error}
                    </p>
                  </div>
                ) : hasNotices ? (
                  <div className="divide-y divide-white/8">
                    {status.notices.map((notice) => {
                      const latestUpdate = getLatestUpdate(notice);

                      return (
                        <section
                          key={`${notice.kind}-${notice.id}`}
                          className="p-5 sm:p-6"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <p
                              className={`text-[10px] font-black uppercase tracking-[0.16em] ${getSeverityClass(
                                notice.incident_severity,
                              )}`}
                            >
                              {notice.kind} /{" "}
                              {notice.incident_severity ??
                                notice.maintenance_status ??
                                "scheduled"}
                            </p>
                            <time
                              dateTime={notice.created_at}
                              className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--muted)]"
                            >
                              {formatDate(notice.created_at)}
                            </time>
                          </div>
                          <h4 className="responsive-text mt-4 font-display text-xl font-black uppercase leading-tight sm:text-2xl">
                            {getStatusText(notice.titles)}
                          </h4>
                          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                            {latestUpdate
                              ? getStatusText(latestUpdate.translations)
                              : "Riot has not published an additional update."}
                          </p>
                          <p className="mt-5 text-[10px] font-black uppercase tracking-[0.14em] text-white/50">
                            {notice.platforms.join(" / ") || "All platforms"}
                          </p>
                        </section>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex min-h-24 items-center gap-4 p-4">
                    <span
                      aria-hidden="true"
                      className="grid size-9 shrink-0 place-items-center border border-emerald-400/30 text-sm font-black text-emerald-300"
                    >
                      OK
                    </span>
                    <div>
                      <p className="font-display text-xl font-black uppercase">
                        No active notices
                      </p>
                      <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                        Riot reports no incidents or scheduled maintenance for
                        this region.
                      </p>
                    </div>
                  </div>
                )}
              </details>
            );
          })}
        </div>

        <p className="mt-8 border-l-2 border-white/20 pl-4 text-xs leading-6 text-[var(--muted)]">
          AgentStats mirrors the official VAL-STATUS feed for convenience. Riot
          Games remains the source of truth for service availability.
        </p>
      </section>
    </main>
  );
}
