import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { after } from "next/server";

import {
  createImprovementPlan,
  createShareReport,
  revokeShareReport,
  saveMatchJournal,
  updateImprovementPlan,
} from "@/app/improve/actions";
import { auth } from "@/auth";
import { syncAgentMatchObservations } from "@/lib/agent-meta";
import {
  buildEvidenceCoach,
  buildSessionDebrief,
  getMetricDefinition,
  getMetricValue,
  IMPROVEMENT_METRICS,
} from "@/lib/improvement";
import { prisma } from "@/lib/db";
import { ImprovementPlanStatus } from "@/lib/generated/prisma/enums";
import { PLAYER_DATA_CONSENT_VERSION } from "@/lib/legal";
import { getPlayerWorkspaceSummary } from "@/lib/player-workspace";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Improve",
  description:
    "Turn official Riot match data into evidence-based coaching, focused plans, session reviews, and match notes.",
  path: "/improve",
  noIndex: true,
});

interface ImprovePageProps {
  searchParams: Promise<{ status?: string; token?: string }>;
}

const regionValues = ["ap", "na", "eu", "kr", "br", "latam"] as const;

function parseRegion(value: string) {
  return regionValues.find((region) => region === value) ?? null;
}

function formatDate(value: Date | number) {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
}

function formatMetric(value: number, unit: string) {
  if (unit === "%") return `${value.toFixed(1)}%`;
  return value.toFixed(1);
}

function getPlanProgress({
  baseline,
  target,
  current,
  direction,
}: {
  baseline: number;
  target: number;
  current: number;
  direction: "higher" | "lower";
}) {
  const total =
    direction === "higher" ? target - baseline : baseline - target;
  const moved =
    direction === "higher" ? current - baseline : baseline - current;
  if (total <= 0) return 0;
  return Math.max(0, Math.min(100, (moved / total) * 100));
}

function statusMessage(status: string | undefined) {
  if (status === "plan-created") return "Improvement plan created.";
  if (status === "plan-updated") return "Plan status updated.";
  if (status === "journal-saved") return "Match journal saved.";
  if (status === "report-created") return "Shareable report created.";
  if (status === "report-revoked") return "Report access revoked.";
  if (status === "unknown-match") {
    return "That match is no longer in the current Riot review window.";
  }
  if (status?.startsWith("invalid")) {
    return "Some submitted fields were not valid.";
  }
  return null;
}

function getVisibleReports(userId: string) {
  const requestedAt = new Date();
  return prisma.shareReport.findMany({
    where: {
      userId,
      OR: [{ expiresAt: null }, { expiresAt: { gt: requestedAt } }],
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
}

export default async function ImprovePage({
  searchParams,
}: ImprovePageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      puuid: true,
      gameName: true,
      tagLine: true,
      region: true,
      consentVersion: true,
      consentedAt: true,
    },
  });
  const region = user ? parseRegion(user.region) : null;
  if (!user?.puuid || !region) redirect("/account");

  const [
    { matches, summary },
    plans,
    journals,
    reports,
    query,
  ] = await Promise.all([
    getPlayerWorkspaceSummary({ puuid: user.puuid, region }),
    prisma.improvementPlan.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    prisma.matchJournal.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
    getVisibleReports(user.id),
    searchParams,
  ]);
  if (
    user.consentedAt &&
    user.consentVersion === PLAYER_DATA_CONSENT_VERSION &&
    matches.length > 0
  ) {
    after(async () => {
      await syncAgentMatchObservations({
        sourceUserId: user.id,
        sourcePuuid: user.puuid!,
        region,
        matches,
      });
    });
  }

  const coach = buildEvidenceCoach(summary);
  const debrief = buildSessionDebrief(summary);
  const journalByMatch = new Map(
    journals.map((journal) => [journal.matchId, journal]),
  );
  const activePlans = plans.filter(
    (plan) => plan.status === ImprovementPlanStatus.ACTIVE,
  );
  const pastPlans = plans.filter(
    (plan) => plan.status !== ImprovementPlanStatus.ACTIVE,
  );
  const notice = statusMessage(query.status);

  return (
    <article>
      <header className="grid-noise border-b border-white/8">
        <div className="mx-auto grid max-w-[86rem] gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-end lg:px-8 lg:py-14">
          <div>
            <p className="eyebrow">Personal review room</p>
            <h1 className="responsive-text mt-4 max-w-4xl font-display text-[clamp(3rem,10vw,6.75rem)] font-black uppercase leading-[0.82] tracking-[-0.075em]">
              Turn matches
              <span className="block text-[var(--accent)]">into decisions.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-sm leading-7 text-[var(--muted)] sm:text-base">
              Coaching signals are derived from your latest {summary.games}{" "}
              Riot matches and {summary.rounds} tracked rounds. They are
              evidence, not a hidden performance score.
            </p>
          </div>
          <div className="grid min-w-64 grid-cols-3 border border-white/10 bg-[var(--panel)]">
            {[
              ["ACS", summary.averageAcs.toFixed(0)],
              ["KAST", `${summary.kast.toFixed(0)}%`],
              ["Win", `${summary.winRate.toFixed(0)}%`],
            ].map(([label, value]) => (
              <div
                key={label}
                className="border-r border-white/10 p-4 last:border-r-0"
              >
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--muted)]">
                  {label}
                </p>
                <p className="mt-2 font-display text-2xl font-black">{value}</p>
              </div>
            ))}
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
            {query.token ? (
              <>
                {" "}
                <Link
                  href={`/report/${query.token}`}
                  className="font-black uppercase tracking-wide text-[var(--accent)] underline underline-offset-4"
                >
                  Open report
                </Link>
              </>
            ) : null}
          </p>
        ) : null}

        <section aria-labelledby="coach-title">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">01 / Evidence coach</p>
              <h2
                id="coach-title"
                className="mt-3 font-display text-3xl font-black uppercase tracking-[-0.05em] sm:text-5xl"
              >
                What deserves attention
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-[var(--muted)]">
              Each recommendation states the observed pattern, the sample
              behind it, and one action to test.
            </p>
          </div>

          <div className="motion-stagger mt-6 grid gap-4 lg:grid-cols-3">
            {coach.map((insight, index) => (
              <article
                key={insight.id}
                className="motion-card border border-white/10 bg-[var(--panel)] p-5 sm:p-6"
              >
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${
                      insight.kind === "strength"
                        ? "bg-emerald-400/12 text-emerald-300"
                        : "bg-[var(--accent)]/12 text-[var(--accent)]"
                    }`}
                  >
                    {insight.kind}
                  </span>
                  <span className="font-mono text-xs text-[var(--muted)]">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="mt-5 font-display text-2xl font-black uppercase leading-none tracking-[-0.04em]">
                  {insight.title}
                </h3>
                <p className="mt-4 text-sm leading-6">{insight.finding}</p>
                <p className="mt-3 border-l border-white/20 pl-3 text-xs leading-5 text-[var(--muted)]">
                  {insight.evidence}
                </p>
                <div className="mt-5 border-t border-white/10 pt-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--accent)]">
                    Next action
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    {insight.action}
                  </p>
                </div>
                {insight.matchIds.length > 0 ? (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {insight.matchIds.map((matchId, matchIndex) => (
                      <Link
                        key={matchId}
                        href={`/match/${matchId}?region=${region}`}
                        className="valorant-action border border-white/12 px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em]"
                      >
                        Evidence {matchIndex + 1}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        <section
          aria-labelledby="debrief-title"
          className="grid gap-5 border-y border-white/10 py-8 lg:grid-cols-[0.72fr_1fr]"
        >
          <div>
            <p className="eyebrow">02 / Session debrief</p>
            <h2
              id="debrief-title"
              className="mt-3 font-display text-3xl font-black uppercase tracking-[-0.05em] sm:text-5xl"
            >
              Close the session clearly
            </h2>
            <p className="mt-5 max-w-lg text-sm leading-7 text-[var(--muted)]">
              Matches less than 90 minutes apart are grouped into one session.
              The comparison uses only completed matches in the current Riot
              window.
            </p>
          </div>

          {debrief ? (
            <div className="border border-white/10 bg-[var(--panel)]">
              <div className="border-b border-white/10 p-5 sm:p-6">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--accent)]">
                  {formatDate(debrief.startedAt)} · {debrief.form.games} matches
                </p>
                <h3 className="mt-3 font-display text-2xl font-black uppercase tracking-[-0.04em]">
                  {debrief.headline}
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4">
                {[
                  ["Record", `${debrief.form.wins}W ${debrief.form.losses}L`],
                  ["Win rate", `${debrief.form.winRate.toFixed(0)}%`],
                  ["ACS", debrief.form.averageAcs.toFixed(0)],
                  ["ADR", debrief.form.averageDamagePerRound.toFixed(0)],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="border-b border-r border-white/10 p-4 sm:border-b-0"
                  >
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--muted)]">
                      {label}
                    </p>
                    <p className="mt-2 font-display text-xl font-black">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
              <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
                <p className="text-sm leading-6 text-[var(--muted)]">
                  ACS change:{" "}
                  <strong className="text-white">
                    {debrief.acsDelta === null
                      ? "No previous session"
                      : `${debrief.acsDelta >= 0 ? "+" : ""}${debrief.acsDelta.toFixed(0)}`}
                  </strong>
                </p>
                <p className="text-sm leading-6 text-[var(--muted)]">
                  Win-rate change:{" "}
                  <strong className="text-white">
                    {debrief.winRateDelta === null
                      ? "No previous session"
                      : `${debrief.winRateDelta >= 0 ? "+" : ""}${debrief.winRateDelta.toFixed(0)} pts`}
                  </strong>
                </p>
                {debrief.reviewMatch ? (
                  <Link
                    href={`/match/${debrief.reviewMatch.matchId}?region=${region}`}
                    className="valorant-action flex min-h-11 items-center justify-center border border-[var(--accent)] px-4 text-[11px] font-black uppercase tracking-[0.14em] sm:col-span-2"
                  >
                    Review {debrief.reviewMatch.mapName} ·{" "}
                    {debrief.reviewMatch.acs.toFixed(0)} ACS
                  </Link>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="border border-white/10 p-6 text-sm text-[var(--muted)]">
              No completed session is available yet.
            </p>
          )}
        </section>

        <section id="plans" aria-labelledby="plans-title">
          <div className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
            <div>
              <p className="eyebrow">03 / Improvement plan</p>
              <h2
                id="plans-title"
                className="mt-3 font-display text-3xl font-black uppercase tracking-[-0.05em] sm:text-5xl"
              >
                One metric. One window.
              </h2>
              <p className="mt-5 text-sm leading-7 text-[var(--muted)]">
                Keep the target stable long enough to judge a trend. Creating a
                new plan for the same metric archives the previous active one.
              </p>

              <form
                action={createImprovementPlan}
                className="mt-6 grid gap-4 border border-white/10 bg-[var(--panel)] p-5"
              >
                <label className="grid gap-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--muted)]">
                    Metric
                  </span>
                  <select
                    name="metric"
                    className="min-h-11 border border-white/15 bg-[var(--ink)] px-3 text-sm"
                  >
                    {IMPROVEMENT_METRICS.map((metric) => (
                      <option key={metric.id} value={metric.id}>
                        {metric.label}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--muted)]">
                      Target value
                    </span>
                    <input
                      name="targetValue"
                      type="number"
                      min="0"
                      max="1000"
                      step="0.1"
                      defaultValue="70"
                      required
                      className="min-h-11 border border-white/15 bg-[var(--ink)] px-3 text-sm"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--muted)]">
                      Review window
                    </span>
                    <select
                      name="durationDays"
                      defaultValue="14"
                      className="min-h-11 border border-white/15 bg-[var(--ink)] px-3 text-sm"
                    >
                      <option value="7">7 days</option>
                      <option value="14">14 days</option>
                      <option value="30">30 days</option>
                    </select>
                  </label>
                </div>
                <button
                  type="submit"
                  className="valorant-action min-h-11 bg-[var(--accent)] px-4 text-[11px] font-black uppercase tracking-[0.14em]"
                >
                  Start plan
                </button>
              </form>
            </div>

            <div className="grid content-start gap-4">
              {activePlans.length === 0 ? (
                <div className="border border-dashed border-white/15 p-8 text-sm leading-7 text-[var(--muted)]">
                  No active plan. Choose the metric most closely connected to
                  the coach evidence above.
                </div>
              ) : (
                activePlans.map((plan) => {
                  const definition = getMetricDefinition(plan.metric);
                  const current = getMetricValue(summary, plan.metric);
                  const progress = getPlanProgress({
                    baseline: plan.baselineValue,
                    target: plan.targetValue,
                    current,
                    direction: definition.direction,
                  });
                  return (
                    <article
                      key={plan.id}
                      className="border border-white/10 bg-[var(--panel)] p-5 sm:p-6"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--accent)]">
                            Active until {formatDate(plan.endsAt)}
                          </p>
                          <h3 className="mt-2 font-display text-2xl font-black uppercase tracking-[-0.04em]">
                            {definition.label}
                          </h3>
                          <p className="mt-2 text-sm text-[var(--muted)]">
                            {definition.description}
                          </p>
                        </div>
                        <p className="font-display text-4xl font-black">
                          {formatMetric(current, definition.unit)}
                        </p>
                      </div>
                      <div className="mt-6 h-2 bg-white/8">
                        <div
                          className="h-full bg-[var(--accent)]"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="mt-3 flex justify-between gap-4 text-xs text-[var(--muted)]">
                        <span>
                          Baseline{" "}
                          {formatMetric(plan.baselineValue, definition.unit)}
                        </span>
                        <span>
                          Target{" "}
                          {formatMetric(plan.targetValue, definition.unit)}
                        </span>
                      </div>
                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <form action={updateImprovementPlan}>
                          <input type="hidden" name="planId" value={plan.id} />
                          <input
                            type="hidden"
                            name="status"
                            value="COMPLETED"
                          />
                          <button
                            type="submit"
                            className="valorant-action min-h-10 w-full border border-emerald-400/40 px-3 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-300"
                          >
                            Complete
                          </button>
                        </form>
                        <form action={updateImprovementPlan}>
                          <input type="hidden" name="planId" value={plan.id} />
                          <input
                            type="hidden"
                            name="status"
                            value="ARCHIVED"
                          />
                          <button
                            type="submit"
                            className="valorant-action min-h-10 w-full border border-white/15 px-3 text-[10px] font-black uppercase tracking-[0.12em]"
                          >
                            Archive
                          </button>
                        </form>
                      </div>
                    </article>
                  );
                })
              )}

              {pastPlans.length > 0 ? (
                <details className="border border-white/10 p-5">
                  <summary className="cursor-pointer text-xs font-black uppercase tracking-[0.16em]">
                    Plan history ({pastPlans.length})
                  </summary>
                  <div className="mt-4 grid gap-3">
                    {pastPlans.map((plan) => (
                      <div
                        key={plan.id}
                        className="flex items-center justify-between gap-4 border-t border-white/10 pt-3 text-sm"
                      >
                        <span>{getMetricDefinition(plan.metric).label}</span>
                        <span className="text-xs uppercase text-[var(--muted)]">
                          {plan.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </details>
              ) : null}
            </div>
          </div>
        </section>

        <section
          id="journal"
          aria-labelledby="journal-title"
          className="border-t border-white/10 pt-8"
        >
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">04 / Match journal</p>
              <h2
                id="journal-title"
                className="mt-3 font-display text-3xl font-black uppercase tracking-[-0.05em] sm:text-5xl"
              >
                Add the context Riot cannot know
              </h2>
            </div>
            <p className="max-w-lg text-sm leading-6 text-[var(--muted)]">
              Focus, mood, stack size, and VOD links are private to your
              account. They are never included in a public report.
            </p>
          </div>

          <div className="mt-6 grid gap-3">
            {summary.matches.slice(0, 6).map((match, index) => {
              const journal = journalByMatch.get(match.matchId);
              return (
                <details
                  key={match.matchId}
                  open={index === 0 && !journal}
                  className="group border border-white/10 bg-[var(--panel)]"
                >
                  <summary className="grid cursor-pointer list-none gap-3 p-4 sm:grid-cols-[1fr_auto_auto] sm:items-center sm:p-5">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--muted)]">
                        {formatDate(match.playedAt)} · {match.queue}
                      </p>
                      <p className="mt-2 font-display text-xl font-black uppercase">
                        {match.mapName} / {match.agentName}
                      </p>
                    </div>
                    <p
                      className={`font-black ${
                        match.result === "WIN"
                          ? "text-emerald-300"
                          : match.result === "LOSS"
                            ? "text-[var(--accent)]"
                            : "text-[var(--muted)]"
                      }`}
                    >
                      {match.result} {match.score}
                    </p>
                    <p className="text-sm text-[var(--muted)]">
                      {match.kills}/{match.deaths}/{match.assists} ·{" "}
                      {match.acs.toFixed(0)} ACS
                    </p>
                  </summary>
                  <form
                    action={saveMatchJournal}
                    className="grid gap-4 border-t border-white/10 p-4 sm:p-5"
                  >
                    <input
                      type="hidden"
                      name="matchId"
                      value={match.matchId}
                    />
                    <div className="grid gap-4 sm:grid-cols-3">
                      <label className="grid gap-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--muted)]">
                          Session focus
                        </span>
                        <input
                          name="focus"
                          defaultValue={journal?.focus ?? ""}
                          placeholder="e.g. trade spacing"
                          required
                          maxLength={80}
                          className="min-h-11 border border-white/15 bg-[var(--ink)] px-3 text-sm"
                        />
                      </label>
                      <label className="grid gap-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--muted)]">
                          Mood
                        </span>
                        <select
                          name="mood"
                          defaultValue={journal?.mood ?? 3}
                          className="min-h-11 border border-white/15 bg-[var(--ink)] px-3 text-sm"
                        >
                          <option value="1">1 · Drained</option>
                          <option value="2">2 · Distracted</option>
                          <option value="3">3 · Neutral</option>
                          <option value="4">4 · Focused</option>
                          <option value="5">5 · Sharp</option>
                        </select>
                      </label>
                      <label className="grid gap-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--muted)]">
                          Party size
                        </span>
                        <select
                          name="stackSize"
                          defaultValue={journal?.stackSize ?? 1}
                          className="min-h-11 border border-white/15 bg-[var(--ink)] px-3 text-sm"
                        >
                          <option value="1">Solo</option>
                          <option value="2">Duo</option>
                          <option value="3">Trio</option>
                          <option value="4">Four stack</option>
                          <option value="5">Five stack</option>
                        </select>
                      </label>
                    </div>
                    <label className="grid gap-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--muted)]">
                        Review note
                      </span>
                      <textarea
                        name="note"
                        defaultValue={journal?.note ?? ""}
                        placeholder="What decision should you repeat or change?"
                        required
                        rows={4}
                        maxLength={1200}
                        className="border border-white/15 bg-[var(--ink)] p-3 text-sm leading-6"
                      />
                    </label>
                    <label className="grid gap-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--muted)]">
                        Optional VOD URL
                      </span>
                      <input
                        name="vodUrl"
                        type="url"
                        defaultValue={journal?.vodUrl ?? ""}
                        placeholder="https://..."
                        maxLength={500}
                        className="min-h-11 border border-white/15 bg-[var(--ink)] px-3 text-sm"
                      />
                    </label>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="submit"
                        className="valorant-action min-h-10 bg-[var(--accent)] px-5 text-[10px] font-black uppercase tracking-[0.12em]"
                      >
                        {journal ? "Update note" : "Save note"}
                      </button>
                      <Link
                        href={`/match/${match.matchId}?region=${region}`}
                        className="valorant-action flex min-h-10 items-center border border-white/15 px-5 text-[10px] font-black uppercase tracking-[0.12em]"
                      >
                        Open match
                      </Link>
                    </div>
                  </form>
                </details>
              );
            })}
          </div>
        </section>

        <section
          id="reports"
          aria-labelledby="reports-title"
          className="grid gap-6 border-t border-white/10 pt-8 lg:grid-cols-[0.8fr_1.2fr]"
        >
          <div>
            <p className="eyebrow">05 / Performance report</p>
            <h2
              id="reports-title"
              className="mt-3 font-display text-3xl font-black uppercase tracking-[-0.05em] sm:text-5xl"
            >
              Share a controlled snapshot
            </h2>
            <p className="mt-5 text-sm leading-7 text-[var(--muted)]">
              Reports freeze the current aggregate metrics. They exclude match
              IDs, journals, teammates, and raw Riot payloads. Revoke the link
              at any time.
            </p>
            <form
              action={createShareReport}
              className="mt-6 grid gap-4 border border-white/10 bg-[var(--panel)] p-5"
            >
              <label className="grid gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--muted)]">
                  Report title
                </span>
                <input
                  name="title"
                  defaultValue="Recent performance review"
                  minLength={3}
                  maxLength={80}
                  required
                  className="min-h-11 border border-white/15 bg-[var(--ink)] px-3 text-sm"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--muted)]">
                  Link lifetime
                </span>
                <select
                  name="expiryDays"
                  defaultValue="30"
                  className="min-h-11 border border-white/15 bg-[var(--ink)] px-3 text-sm"
                >
                  <option value="7">7 days</option>
                  <option value="30">30 days</option>
                  <option value="0">No automatic expiry</option>
                </select>
              </label>
              <label className="flex items-start gap-3 text-sm leading-6 text-[var(--muted)]">
                <input
                  type="checkbox"
                  name="anonymized"
                  defaultChecked
                  className="mt-1 size-4 shrink-0 accent-[var(--accent)]"
                />
                Hide my Riot ID and publish as Anonymous player.
              </label>
              <label className="flex items-start gap-3 border-l-2 border-[var(--accent)] bg-black/15 p-4 text-sm leading-6 text-[var(--muted)]">
                <input
                  type="checkbox"
                  name="publicationConsent"
                  value="on"
                  required
                  className="mt-1 size-4 shrink-0 accent-[var(--accent)]"
                />
                I understand anyone with this unlisted link can view the
                performance snapshot until it expires or I revoke it.
              </label>
              <button
                type="submit"
                className="valorant-action min-h-11 bg-[var(--accent)] px-4 text-[11px] font-black uppercase tracking-[0.14em]"
              >
                Generate report
              </button>
            </form>
          </div>

          <div className="grid content-start gap-3">
            {reports.length === 0 ? (
              <p className="border border-dashed border-white/15 p-8 text-sm text-[var(--muted)]">
                No reports generated yet.
              </p>
            ) : (
              reports.map((report) => {
                const active = !report.revokedAt;
                return (
                  <article
                    key={report.id}
                    className="grid gap-4 border border-white/10 bg-[var(--panel)] p-5 sm:grid-cols-[1fr_auto] sm:items-center"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display text-xl font-black uppercase">
                          {report.title}
                        </h3>
                        <span
                          className={`px-2 py-1 text-[9px] font-black uppercase tracking-[0.14em] ${
                            active
                              ? "bg-emerald-400/12 text-emerald-300"
                              : "bg-white/8 text-[var(--muted)]"
                          }`}
                        >
                          {active ? "Active" : "Revoked"}
                        </span>
                      </div>
                      <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
                        Created {formatDate(report.createdAt)} ·{" "}
                        {report.anonymized ? "Anonymous" : "Riot ID visible"} ·{" "}
                        {report.expiresAt
                          ? `expires ${formatDate(report.expiresAt)}`
                          : "no automatic expiry"}
                      </p>
                    </div>
                    {active ? (
                      <div className="flex gap-2">
                        <Link
                          href={`/report/${report.token}`}
                          className="valorant-action flex min-h-10 items-center border border-white/15 px-4 text-[10px] font-black uppercase tracking-[0.12em]"
                        >
                          Open
                        </Link>
                        <form action={revokeShareReport}>
                          <input
                            type="hidden"
                            name="reportId"
                            value={report.id}
                          />
                          <button
                            type="submit"
                            className="valorant-action min-h-10 border border-[var(--accent)] px-4 text-[10px] font-black uppercase tracking-[0.12em] text-[var(--accent)]"
                          >
                            Revoke
                          </button>
                        </form>
                      </div>
                    ) : null}
                  </article>
                );
              })
            )}

            <Link
              href="/teams"
              className="valorant-action mt-3 flex min-h-14 items-center justify-between border border-white/15 px-5 text-xs font-black uppercase tracking-[0.14em]"
            >
              Open opt-in team workspace
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>
      </div>
    </article>
  );
}
