import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import {
  disconnectRiotAccount,
  logOut,
  updateAccountSettings,
} from "@/app/account/actions";
import { REGIONS } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { PLAYER_DATA_CONSENT_VERSION } from "@/lib/legal";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Riot Account Settings",
  description:
    "Manage your linked Riot account, player profile region, consent, and public visibility on AgentStats.",
  path: "/account",
  noIndex: true,
});

interface AccountPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function AccountPage({
  searchParams,
}: AccountPageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [user, query] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id } }),
    searchParams,
  ]);
  if (!user) redirect("/login");
  const hasCurrentDataConsent = Boolean(
    user.consentedAt &&
      user.consentVersion === PLAYER_DATA_CONSENT_VERSION,
  );

  const profileHref =
    user.gameName && user.tagLine
      ? `/player/${user.region}/${encodeURIComponent(user.gameName)}/${encodeURIComponent(user.tagLine)}`
      : null;

  return (
    <article>
      <header className="grid-noise border-b border-white/8">
        <div className="mx-auto max-w-[86rem] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <p className="eyebrow">Connected account</p>
          <h1 className="responsive-text mt-4 font-display text-[clamp(2.4rem,8vw,4.25rem)] font-black uppercase leading-[0.87] tracking-[-0.06em]">
            {user.gameName ?? "Riot player"}
            {user.tagLine ? (
              <span className="text-[var(--accent)]">#{user.tagLine}</span>
            ) : null}
          </h1>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="border border-white/12 px-4 py-2 text-xs font-black uppercase tracking-widest">
              {user.visibility} profile
            </span>
            <span className="border border-white/12 px-4 py-2 text-xs font-black uppercase tracking-widest">
              Region {user.region}
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[86rem] gap-5 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_0.42fr] lg:px-8 lg:py-10">
        <section className="border border-white/10 bg-[var(--panel)] p-5 sm:p-6">
          <p className="eyebrow">Profile controls</p>
          <h2 className="mt-4 font-display text-3xl font-black uppercase tracking-[-0.05em]">
            Visibility and consent
          </h2>

          {query.status ? (
            <p
              role="status"
              className={`mt-6 border p-4 text-sm ${
                query.status === "saved"
                  ? "border-emerald-400/35 bg-emerald-400/8 text-emerald-200"
                  : "border-amber-300/35 bg-amber-300/8 text-amber-100"
              }`}
            >
              {query.status === "saved"
                ? "Account settings saved."
                : query.status === "consent-required"
                  ? "Confirm the public profile statement before publishing."
                  : query.status === "data-consent-required"
                    ? "Your data consent is outdated. Disconnect and reconnect through Riot Sign On to accept the current terms before publishing."
                    : query.status === "disconnect-confirmation"
                      ? "Confirm that you understand this permanently deletes your AgentStats account data."
                  : "The submitted settings were not valid."}
            </p>
          ) : null}

          <form action={updateAccountSettings} className="mt-6 grid gap-5">
            <label className="grid gap-3">
              <span className="text-xs font-black uppercase tracking-[0.16em] text-[var(--muted)]">
                Primary region
              </span>
              <select
                name="region"
                defaultValue={user.region}
                className="min-h-11 border border-white/15 bg-[var(--ink)] px-3 text-sm font-black uppercase focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
              >
                {REGIONS.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </label>

            <fieldset className="grid gap-3">
              <legend className="text-xs font-black uppercase tracking-[0.16em] text-[var(--muted)]">
                Who can view match statistics?
              </legend>
              <label className="flex min-h-14 cursor-pointer items-start gap-3 border border-white/12 p-3.5">
                <input
                  type="radio"
                  name="visibility"
                  value="PRIVATE"
                  defaultChecked={user.visibility === "PRIVATE"}
                  className="mt-1 size-4 accent-[var(--accent)]"
                />
                <span>
                  <strong className="block uppercase">Only me</strong>
                  <span className="mt-1 block text-sm leading-6 text-[var(--muted)]">
                    Your linked profile and full match statistics require your
                    active session.
                  </span>
                </span>
              </label>
              <label className="flex min-h-14 cursor-pointer items-start gap-3 border border-white/12 p-3.5">
                <input
                  type="radio"
                  name="visibility"
                  value="PUBLIC"
                  defaultChecked={user.visibility === "PUBLIC"}
                  className="mt-1 size-4 accent-[var(--accent)]"
                />
                <span>
                  <strong className="block uppercase">Public profile</strong>
                  <span className="mt-1 block text-sm leading-6 text-[var(--muted)]">
                    Anyone with your Riot ID link can view statistics derived
                    from your official Riot match data.
                  </span>
                </span>
              </label>
            </fieldset>

            <label className="flex cursor-pointer items-start gap-4 border-l-2 border-[var(--accent)] bg-black/15 p-4">
              <input
                type="checkbox"
                name="publicationConsent"
                defaultChecked={user.visibility === "PUBLIC"}
                className="mt-1 size-4 shrink-0 accent-[var(--accent)]"
              />
              <span className="text-sm leading-6 text-[var(--muted)]">
                I understand that choosing Public allows AgentStats to display
                my Riot ID, recent matches, and statistics derived from those
                matches to other visitors. This public-profile choice is
                separate from aggregate analytics, and I can withdraw it here.
              </span>
            </label>

            <button
              type="submit"
              className="valorant-action min-h-10 bg-[var(--accent)] px-4 text-[11px] font-black uppercase tracking-[0.12em] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              Save profile settings
            </button>
          </form>
        </section>

        <aside className="grid content-start gap-4">
          <section className="border border-white/10 bg-[var(--panel)] p-5">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--accent)]">
              Performance workspace
            </p>
            <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
              Review evidence-based coaching, set one measurable target, keep
              private match notes, and control shareable reports.
            </p>
            <div className="mt-5 grid gap-3">
              <Link
                href="/improve"
                className="valorant-action flex min-h-10 items-center justify-center bg-[var(--accent)] px-4 text-[11px] font-black uppercase tracking-[0.12em]"
              >
                Open improve
              </Link>
              <Link
                href="/teams"
                className="valorant-action flex min-h-10 items-center justify-center border border-white/15 px-4 text-[11px] font-black uppercase tracking-[0.12em]"
              >
                Team workspaces
              </Link>
            </div>
          </section>

          <section className="border border-white/10 p-5">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--muted)]">
              Aggregate analytics
            </p>
            <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
              {hasCurrentDataConsent
                ? "Active. Your own pseudonymized match observations may contribute to pick rates, win rates, competitive picks by rank, and map frequency. Meta pages do not show your Riot ID."
                : "Inactive because your recorded consent does not match the current policy version. Reconnect through Riot Sign On to participate."}
            </p>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              Making your profile private only stops public profile access.
              Disconnecting deletes your account and linked aggregate
              observations.
            </p>
          </section>

          <section className="border border-white/10 p-5">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--muted)]">
              Profile
            </p>
            <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
              Your Riot password and OAuth tokens are not stored by AgentStats.
              A database session keeps this browser signed in.
            </p>
            {profileHref ? (
              <Link
                href={profileHref}
                className="valorant-action mt-5 flex min-h-10 items-center justify-center border border-white/15 px-4 text-[11px] font-black uppercase tracking-[0.12em]"
              >
                Open my profile
              </Link>
            ) : null}
            <form action={logOut} className="mt-3">
              <button
                type="submit"
                className="valorant-action min-h-10 w-full border border-white/15 px-4 text-[11px] font-black uppercase tracking-[0.12em]"
              >
                Sign out
              </button>
            </form>
          </section>

          <section className="border border-[var(--accent)]/40 bg-[var(--accent)]/5 p-5">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--accent)]">
              Disconnect
            </p>
            <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
              This deletes your AgentStats user, linked Riot identity, active
              consent state, sessions, and aggregate match observations.
              Riot&apos;s own data is unaffected.
            </p>
            <form action={disconnectRiotAccount} className="mt-6">
              <label className="mb-4 flex cursor-pointer items-start gap-3 text-xs leading-5 text-[var(--muted)]">
                <input
                  type="checkbox"
                  name="disconnectConfirmation"
                  value="on"
                  required
                  className="mt-0.5 size-4 shrink-0 accent-[var(--accent)]"
                />
                <span>
                  I understand this permanently deletes my AgentStats account
                  and linked observations.
                </span>
              </label>
              <button
                type="submit"
                className="valorant-action min-h-10 w-full border border-[var(--accent)] px-4 text-[11px] font-black uppercase tracking-[0.12em] text-[var(--accent)]"
              >
                Disconnect and delete
              </button>
            </form>
          </section>
        </aside>
      </div>
    </article>
  );
}
