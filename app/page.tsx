import type { Metadata } from "next";
import Image from "next/image";

import { PlayerSearch } from "@/components/player-search";
import { RouteLink } from "@/components/route-link";
import { createMetadata } from "@/lib/seo";
import { getAgents } from "@/lib/valorant-api";

export const metadata: Metadata = createMetadata({
  title: "AgentStats - Valorant Stats, Agents, Skins & Leaderboards",
  description:
    "Explore Valorant agents, weapons, skins, bundles, maps, ranked leaderboards, service status, and player lookup tools.",
  path: "/",
});

export default async function HomePage() {
  const agents = await getAgents();
  const featuredAgent =
    agents.find((agent) => agent.displayName === "Jett") ?? agents[0];
  const featuredPortrait =
    featuredAgent.fullPortrait ?? featuredAgent.displayIcon;
  const metrics = [
    { value: agents.length.toString(), label: "Playable agents" },
    { value: "9", label: "Competitive ranks" },
    { value: "6", label: "Global regions" },
  ] as const;

  return (
    <>
      <section className="grid-noise relative isolate overflow-hidden">
        <div className="absolute -right-24 top-8 -z-20 h-[34rem] w-[34rem] rotate-12 border-[6rem] border-white/[0.025]" />
        <div className="absolute inset-y-0 right-0 -z-20 hidden w-[48%] bg-[linear-gradient(135deg,rgba(255,70,85,0.09),transparent_42%)] lg:block" />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[26rem] overflow-hidden lg:hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--ink)] via-[var(--ink)]/45 to-[var(--ink)]" />
          <Image
            src={featuredPortrait}
            alt=""
            fill
            priority
            unoptimized
            sizes="100vw"
            className="object-contain object-right-bottom opacity-[0.14]"
          />
        </div>

        <div
          className="pointer-events-none absolute z-[5] hidden overflow-hidden lg:block"
          style={{ width: "54%", top: 0, right: 0, bottom: 0 }}
        >
          <div className="absolute inset-0 z-10 bg-gradient-to-r from-[var(--ink)] via-transparent to-transparent" />
          <Image
            src={featuredPortrait}
            alt={`${featuredAgent.displayName}, a Valorant agent`}
            fill
            priority
            unoptimized
            sizes="54vw"
            className="object-contain object-right-bottom"
          />
        </div>

        <div className="mx-auto grid min-h-[calc(100svh-4rem)] w-full min-w-0 max-w-7xl items-center gap-14 px-5 py-16 sm:py-20 lg:grid-cols-[1fr_0.72fr] lg:px-8">
          <div className="relative z-10 min-w-0">
            <p className="eyebrow">Know your game</p>
            <h1 className="responsive-text mt-7 max-w-5xl font-display text-[clamp(3.25rem,16vw,8.8rem)] font-black uppercase leading-[0.78] tracking-[-0.075em] sm:tracking-[-0.085em] lg:text-[clamp(5.5rem,7.6vw,8.2rem)]">
              Read the
              <span className="block text-[var(--accent)]">match.</span>
              Own the next.
            </h1>
            <p className="responsive-text mt-8 max-w-xl text-lg leading-8 text-[var(--muted)]">
              Review recent performance, identify your strengths, and prepare
              for the next match.
            </p>
            <div className="mt-10 min-w-0 max-w-3xl overflow-hidden">
              <div id="search">
                <PlayerSearch />
              </div>
              <p className="mt-3 text-xs text-[#75808d]">
                Use the same name and tag shown in the game.
              </p>
            </div>
          </div>

          <aside
            className="group relative z-20 hidden flex-col justify-between py-10 lg:flex"
            style={{ minHeight: "42rem" }}
          >
            <div className="relative z-20 ml-8">
              <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-[var(--accent)]">
                Agent archive / 01
              </p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
                Valorant protocol
              </p>
            </div>

            <div className="relative z-20 ml-8 flex items-end justify-between gap-6">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--accent)]">
                  Featured agent
                </p>
                <div className="mt-2 flex items-end gap-4">
                  <h2 className="font-display text-7xl font-black uppercase leading-none tracking-[-0.065em]">
                    {featuredAgent.displayName}
                  </h2>
                  {featuredAgent.role ? (
                    <Image
                      src={featuredAgent.role.displayIcon}
                      alt=""
                      width={36}
                      height={36}
                      aria-hidden="true"
                      className="mb-1 size-8 opacity-60"
                    />
                  ) : null}
                </div>
                <p className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
                  {featuredAgent.role?.displayName ?? "Valorant agent"}
                </p>
              </div>

              <div className="mb-1 text-right">
                <span className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.15em] text-[#aeb8c3]">
                  <span className="size-1.5 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                  Roster online
                </span>
                <span className="mt-5 block text-[10px] font-black uppercase tracking-[0.16em] text-white transition-transform group-hover:translate-x-1">
                  View profile →
                </span>
              </div>
            </div>

            <RouteLink
              href={`/agents/${featuredAgent.uuid}`}
              aria-label={`View ${featuredAgent.displayName} agent profile`}
              className="absolute inset-0 z-30 block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
            >
              <span className="sr-only">
                View {featuredAgent.displayName} profile
              </span>
            </RouteLink>
          </aside>
        </div>
      </section>

      <section className="border-y border-white/8 bg-[#0e141b]">
        <div className="mx-auto grid max-w-7xl sm:grid-cols-3">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="border-b border-white/8 px-5 py-8 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0 lg:px-8"
            >
              <p className="font-display text-4xl font-black tracking-[-0.05em]">
                {metric.value}
              </p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
                {metric.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
        <p className="eyebrow">Explore the game</p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              href: "/meta",
              number: "00",
              title: "Agent meta",
              copy: "Track live patch impact, roster structure, and Riot status.",
            },
            {
              href: "/agents",
              number: "01",
              title: "Agents",
              copy: "Explore every role, ability, and agent playstyle.",
            },
            {
              href: "/weapons",
              number: "02",
              title: "Weapons",
              copy: "Compare weapon power, price, and available collections.",
            },
            {
              href: "/maps",
              number: "03",
              title: "Maps",
              copy: "Study every arena and its tactical layout.",
            },
          ].map((item) => (
            <RouteLink
              key={item.href}
              href={item.href}
              className="group valorant-panel min-h-72 p-7 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
            >
              <span className="font-mono text-xs text-[var(--accent)]">{item.number}</span>
              <h2 className="mt-20 font-display text-4xl font-black uppercase tracking-[-0.05em]">
                {item.title}
              </h2>
              <p className="mt-3 max-w-xs text-sm leading-6 text-[var(--muted)]">
                {item.copy}
              </p>
              <span className="mt-7 inline-block text-sm font-black uppercase tracking-widest transition group-hover:translate-x-1">
                Explore →
              </span>
            </RouteLink>
          ))}
        </div>
      </section>
    </>
  );
}
