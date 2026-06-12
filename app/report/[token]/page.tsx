import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/db";
import { shareReportSnapshotSchema } from "@/lib/share-report";

interface ReportPageProps {
  params: Promise<{ token: string }>;
}

async function getActiveReport(token: string) {
  const report = await prisma.shareReport.findUnique({
    where: { token },
    select: {
      title: true,
      snapshot: true,
      expiresAt: true,
      revokedAt: true,
      createdAt: true,
    },
  });
  if (
    !report ||
    report.revokedAt ||
    (report.expiresAt && report.expiresAt.getTime() <= Date.now())
  ) {
    return null;
  }
  const snapshot = shareReportSnapshotSchema.safeParse(report.snapshot);
  if (!snapshot.success) return null;
  return { ...report, snapshot: snapshot.data };
}

export async function generateMetadata({
  params,
}: ReportPageProps): Promise<Metadata> {
  const { token } = await params;
  const report = await getActiveReport(token);
  return {
    title: report?.title ?? "Performance report",
    description:
      "A controlled AgentStats performance snapshot derived from official Riot match data.",
    robots: { index: false, follow: false },
  };
}

function formatDate(value: Date | number) {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
}

export default async function ReportPage({ params }: ReportPageProps) {
  const { token } = await params;
  const report = await getActiveReport(token);
  if (!report) notFound();

  const { snapshot } = report;
  const identity = snapshot.identity.gameName
    ? `${snapshot.identity.gameName}${snapshot.identity.tagLine ? `#${snapshot.identity.tagLine}` : ""}`
    : "Anonymous player";

  return (
    <article>
      <header className="grid-noise border-b border-white/8">
        <div className="mx-auto max-w-[76rem] px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="eyebrow">Performance snapshot</p>
            <span className="border border-white/12 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-[var(--muted)]">
              Unlisted report
            </span>
          </div>
          <h1 className="responsive-text mt-5 max-w-5xl font-display text-[clamp(3rem,9vw,7rem)] font-black uppercase leading-[0.82] tracking-[-0.075em]">
            {report.title}
          </h1>
          <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-xs font-black uppercase tracking-[0.14em] text-[var(--muted)]">
            <span className="text-white">{identity}</span>
            <span>Region {snapshot.identity.region}</span>
            <span>Generated {formatDate(snapshot.generatedAt)}</span>
            <span>
              Sample {snapshot.sample.games} matches / {snapshot.sample.rounds}{" "}
              rounds
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[76rem] gap-10 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <section aria-labelledby="report-metrics-title">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Current window</p>
              <h2
                id="report-metrics-title"
                className="mt-3 font-display text-3xl font-black uppercase tracking-[-0.05em] sm:text-5xl"
              >
                Performance markers
              </h2>
            </div>
            <p className="hidden text-sm text-[var(--muted)] sm:block">
              {snapshot.sample.wins}W / {snapshot.sample.losses}L
            </p>
          </div>
          <div className="mt-6 grid grid-cols-2 border-l border-t border-white/10 md:grid-cols-3">
            {snapshot.metrics.map((metric) => (
              <div
                key={metric.label}
                className="border-b border-r border-white/10 bg-[var(--panel)] p-4 sm:p-6"
              >
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--muted)]">
                  {metric.label}
                </p>
                <p className="mt-3 font-display text-3xl font-black sm:text-4xl">
                  {metric.value}
                </p>
                <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
                  {metric.note}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section
          aria-labelledby="report-coach-title"
          className="border-y border-white/10 py-9"
        >
          <p className="eyebrow">Evidence-based review</p>
          <h2
            id="report-coach-title"
            className="mt-3 font-display text-3xl font-black uppercase tracking-[-0.05em] sm:text-5xl"
          >
            Findings and next actions
          </h2>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {snapshot.coach.map((insight) => (
              <article
                key={insight.title}
                className="border border-white/10 bg-[var(--panel)] p-5"
              >
                <span
                  className={`text-[10px] font-black uppercase tracking-[0.16em] ${
                    insight.kind === "strength"
                      ? "text-emerald-300"
                      : "text-[var(--accent)]"
                  }`}
                >
                  {insight.kind}
                </span>
                <h3 className="mt-3 font-display text-2xl font-black uppercase leading-none tracking-[-0.04em]">
                  {insight.title}
                </h3>
                <p className="mt-4 text-sm leading-6">{insight.finding}</p>
                <p className="mt-3 border-l border-white/20 pl-3 text-xs leading-5 text-[var(--muted)]">
                  {insight.evidence}
                </p>
                <p className="mt-5 border-t border-white/10 pt-4 text-sm leading-6 text-[var(--muted)]">
                  <strong className="text-white">Next:</strong>{" "}
                  {insight.action}
                </p>
              </article>
            ))}
          </div>
        </section>

        {snapshot.session ? (
          <section
            aria-labelledby="report-session-title"
            className="grid gap-5 lg:grid-cols-[0.7fr_1.3fr]"
          >
            <div>
              <p className="eyebrow">Latest session</p>
              <h2
                id="report-session-title"
                className="mt-3 font-display text-3xl font-black uppercase tracking-[-0.05em] sm:text-5xl"
              >
                {snapshot.session.headline}
              </h2>
            </div>
            <div className="grid grid-cols-2 border-l border-t border-white/10 sm:grid-cols-4">
              {[
                ["Matches", snapshot.session.games.toString()],
                ["Win rate", `${snapshot.session.winRate.toFixed(0)}%`],
                ["ACS", snapshot.session.averageAcs.toFixed(0)],
                ["ADR", snapshot.session.averageDamagePerRound.toFixed(0)],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="border-b border-r border-white/10 p-5"
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--muted)]">
                    {label}
                  </p>
                  <p className="mt-3 font-display text-2xl font-black">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="grid gap-5 border-t border-white/10 pt-9 lg:grid-cols-2">
          {[
            ["Most played agents", snapshot.topAgents],
            ["Most played maps", snapshot.topMaps],
          ].map(([title, rows]) => (
            <div key={title as string} className="border border-white/10">
              <h2 className="border-b border-white/10 p-5 font-display text-2xl font-black uppercase tracking-[-0.04em]">
                {title as string}
              </h2>
              <div>
                {(rows as typeof snapshot.topAgents).map((row, index) => (
                  <div
                    key={row.name}
                    className="grid grid-cols-[auto_1fr_auto] items-center gap-4 border-b border-white/8 p-4 last:border-b-0"
                  >
                    <span className="font-mono text-xs text-[var(--muted)]">
                      0{index + 1}
                    </span>
                    <div>
                      <p className="font-black uppercase">{row.name}</p>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        {row.games} matches · {row.averageAcs.toFixed(0)} ACS
                      </p>
                    </div>
                    <span className="font-display text-xl font-black">
                      {row.winRate.toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-5 border-t border-white/10 pt-7">
          <p className="max-w-2xl text-xs leading-6 text-[var(--muted)]">
            This is a frozen aggregate snapshot. It does not include journals,
            match IDs, teammates, or raw Riot API payloads. AgentStats is not
            endorsed by Riot Games.
          </p>
          <Link
            href="/"
            className="valorant-action flex min-h-11 items-center border border-white/15 px-5 text-[10px] font-black uppercase tracking-[0.14em]"
          >
            Explore AgentStats
          </Link>
        </footer>
      </div>
    </article>
  );
}
