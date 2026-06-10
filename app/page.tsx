import Image from "next/image";

import { PlayerSearch } from "@/components/player-search";
import { RouteLink } from "@/components/route-link";
import { getAgents } from "@/lib/valorant-api";

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
        <div className="absolute -right-24 top-8 -z-10 h-[34rem] w-[34rem] rotate-12 border-[6rem] border-white/[0.025]" />
        <div className="mx-auto grid min-h-[calc(100svh-4rem)] max-w-7xl items-center gap-14 px-5 py-20 lg:grid-cols-[1fr_0.72fr] lg:px-8">
          <div>
            <p className="eyebrow">Know your game</p>
            <h1 className="mt-7 max-w-5xl font-display text-[clamp(4rem,10vw,8.8rem)] font-black uppercase leading-[0.76] tracking-[-0.085em]">
              Read the
              <span className="block text-[var(--accent)]">match.</span>
              Own the next.
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-8 text-[var(--muted)]">
              Review recent performance, identify your strengths, and prepare
              for the next match.
            </p>
            <div className="mt-10 max-w-3xl">
              <div id="search">
                <PlayerSearch />
              </div>
              <p className="mt-3 text-xs text-[#75808d]">
                Use the same name and tag shown in the game.
              </p>
            </div>
          </div>

          <aside className="relative hidden min-h-[34rem] border-l border-white/10 pl-10 lg:block">
            <RouteLink
              href={`/agents/${featuredAgent.uuid}`}
              className="group relative block min-h-[34rem] overflow-hidden border border-white/10 bg-[#111820] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
            >
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,70,85,0.18),transparent_38%),linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:auto,40px_40px,40px_40px]" />
              <div className="absolute -right-8 top-14 font-display text-[8rem] font-black uppercase leading-none tracking-[-0.08em] text-white/[0.035] [writing-mode:vertical-rl]">
                Valorant
              </div>

              <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between border-b border-white/10 p-5">
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-[var(--accent)]">
                    Agent archive / 01
                  </p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
                    Valorant protocol
                  </p>
                </div>
                <span className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.15em] text-[#aeb8c3]">
                  <span className="size-1.5 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                  Roster online
                </span>
              </div>

              <Image
                src={featuredPortrait}
                alt={`${featuredAgent.displayName}, a Valorant agent`}
                fill
                priority
                sizes="(min-width: 1024px) 38vw, 0px"
                className="object-contain object-bottom transition duration-500 ease-out group-hover:scale-[1.025]"
              />

              <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-[#0b1016] via-[#0b1016]/95 to-transparent px-6 pb-6 pt-28">
                <div className="flex items-end justify-between gap-5">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--accent)]">
                      Featured agent
                    </p>
                    <h2 className="mt-2 font-display text-6xl font-black uppercase leading-none tracking-[-0.065em]">
                      {featuredAgent.displayName}
                    </h2>
                    <p className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
                      {featuredAgent.role?.displayName ?? "Valorant agent"}
                    </p>
                  </div>
                  {featuredAgent.role ? (
                    <Image
                      src={featuredAgent.role.displayIcon}
                      alt=""
                      width={38}
                      height={38}
                      aria-hidden="true"
                      className="mb-1 size-9 opacity-70"
                    />
                  ) : null}
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-[10px] font-black uppercase tracking-[0.16em]">
                  <span className="text-[var(--muted)]">Open agent dossier</span>
                  <span className="text-white transition-transform group-hover:translate-x-1">
                    View profile →
                  </span>
                </div>
              </div>
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
