import { PlayerSearch } from "@/components/player-search";
import { RouteLink } from "@/components/route-link";
import { getAgents } from "@/lib/valorant-api";

const signalBars = [
  ["h-20", "h-4"],
  ["h-32", "h-12"],
  ["h-24", "h-8"],
  ["h-40", "h-24"],
  ["h-28", "h-12"],
  ["h-48", "h-32"],
  ["h-36", "h-20"],
  ["h-52", "h-40"],
  ["h-40", "h-28"],
] as const;

export default async function HomePage() {
  const agents = await getAgents();
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

          <aside className="relative hidden min-h-[30rem] border-l border-white/10 pl-10 lg:block">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#687482]">
              Signal / 01
            </p>
            <div className="mt-20">
              <div className="flex items-end gap-3">
                {signalBars.map(([barHeight, signalHeight], index) => (
                  <span
                    key={`${barHeight}-${index}`}
                    className={`flex w-full items-end bg-white/10 ${barHeight}`}
                  >
                    <span className={`block w-full bg-[var(--accent)] ${signalHeight}`} />
                  </span>
                ))}
              </div>
              <div className="mt-5 flex justify-between border-t border-white/10 pt-4 font-mono text-[10px] uppercase tracking-widest text-[#687482]">
                <span>Score trend</span>
                <span className="text-white">+18.4%</span>
              </div>
            </div>
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
