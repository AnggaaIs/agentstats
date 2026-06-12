import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { connectRiotAccount } from "@/app/login/actions";
import { isRsoConfigured } from "@/lib/auth-config";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Connect Riot Account",
  description:
    "Securely connect your Riot account to manage your AgentStats Valorant profile and visibility.",
  path: "/login",
  noIndex: true,
});

interface LoginPageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();
  if (session?.user) redirect("/account");

  const query = await searchParams;
  const configured = isRsoConfigured();

  return (
    <article className="grid-noise">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:px-8 lg:py-12">
        <section>
          <p className="eyebrow">Riot Sign On</p>
          <h1 className="mt-4 max-w-3xl font-display text-[clamp(2.6rem,8vw,4.5rem)] font-black uppercase leading-[0.85] tracking-[-0.06em]">
            Your matches.
            <span className="block text-[var(--accent)]">Your permission.</span>
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-6 text-[var(--muted)] sm:text-base">
            AgentStats uses Riot&apos;s official sign-in flow. Your Riot
            password is entered only on Riot&apos;s website and is never seen or
            stored by AgentStats.
          </p>
        </section>

        <section className="border border-white/12 bg-[var(--panel)] p-5 sm:p-6">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--accent)]">
            Before you connect
          </p>
          <h2 className="mt-3 font-display text-2xl font-black uppercase tracking-[-0.04em]">
            You stay in control
          </h2>
          <ul className="mt-5 grid gap-3 text-sm leading-6 text-[var(--muted)]">
            <li className="border-l-2 border-white/20 pl-4">
              Linking verifies which Valorant profile belongs to you.
            </li>
            <li className="border-l-2 border-white/20 pl-4">
              Your profile starts private. Publishing requires a separate,
              explicit choice.
            </li>
            <li className="border-l-2 border-white/20 pl-4">
              Your own pseudonymized match observations help calculate
              aggregate pick rates, win rates, rank trends, and map frequency.
            </li>
            <li className="border-l-2 border-white/20 pl-4">
              Match composition can add minimal agent, rank, result, queue, and
              map context without publishing another player&apos;s identity or
              performance profile.
            </li>
            <li className="border-l-2 border-white/20 pl-4">
              You can make the profile private without leaving aggregate
              analytics, or disconnect and delete your contribution.
            </li>
            <li className="border-l-2 border-white/20 pl-4">
              Private journals, shareable reports, and team workspaces are
              optional tools that require separate actions after sign-in.
            </li>
          </ul>

          {query.status === "consent-required" ? (
            <p className="mt-5 border border-amber-300/35 bg-amber-300/8 p-4 text-sm leading-6 text-amber-100">
              You must check the legal consent box before continuing.
            </p>
          ) : null}

          {configured ? (
            <form action={connectRiotAccount} className="mt-6">
              <label className="flex cursor-pointer items-start gap-3 border border-white/12 bg-black/15 p-4 text-sm leading-6 text-[var(--muted)]">
                <input
                  type="checkbox"
                  name="legalConsent"
                  value="on"
                  required
                  className="mt-1 size-4 shrink-0 accent-[var(--accent)]"
                />
                <span>
                  I have read and agree to the AgentStats{" "}
                  <Link href="/terms">Terms</Link>,{" "}
                  <Link href="/privacy">Privacy Policy</Link>,{" "}
                  <Link href="/cookies">Cookie Notice</Link>, and{" "}
                  <Link href="/disclaimer">Disclaimer</Link>. I authorize
                  AgentStats to retrieve and process my Riot identity and
                  recent match data, create my private player statistics, and
                  use my own pseudonymized match observations in aggregate
                  statistics such as agent pick and win rates, competitive
                  picks by rank, and map frequency. I understand that optional
                  journals, reports, and team sharing are controlled separately
                  after connection.
                </span>
              </label>
              <button
                type="submit"
                className="valorant-action mt-4 flex min-h-11 w-full items-center justify-center bg-[var(--accent)] px-6 text-xs font-black uppercase tracking-[0.15em] text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                Continue with Riot Games
              </button>
            </form>
          ) : (
            <div className="mt-6 border border-amber-300/35 bg-amber-300/8 p-4">
              <p className="font-black text-amber-200">
                Riot connection is awaiting production approval.
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                The complete flow is prepared, but it remains disabled until
                valid Riot RSO credentials and the production feature flag are
                configured.
              </p>
            </div>
          )}

          <p className="mt-5 text-xs leading-5 text-white/50">
            This consent is required to use Riot Sign On. Linking does not
            publish your Riot ID or personal profile; public visibility remains
            a separate choice on the account page.
          </p>
        </section>
      </div>
    </article>
  );
}
