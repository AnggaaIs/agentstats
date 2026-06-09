import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { getAgent } from "@/lib/valorant-api";

interface AgentPageProps {
  params: Promise<{ uuid: string }>;
}

export async function generateMetadata({
  params,
}: AgentPageProps): Promise<Metadata> {
  try {
    const agent = await getAgent((await params).uuid);
    return {
      title: agent.displayName,
      description: agent.description,
    };
  } catch {
    return { title: "Agent not found" };
  }
}

export default async function AgentPage({ params }: AgentPageProps) {
  const { uuid } = await params;
  let agent;

  try {
    agent = await getAgent(uuid);
  } catch {
    notFound();
  }

  return (
    <article>
      <header className="relative isolate overflow-hidden border-b border-white/8 bg-[#111820]">
        {agent.background ? (
          <Image
            src={agent.background}
            alt=""
            fill
            priority
            sizes="100vw"
            className="-z-20 object-cover opacity-10"
          />
        ) : null}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0b1016] via-[#0b1016]/80 to-transparent" />
        <div className="mx-auto grid min-h-[42rem] max-w-7xl items-end gap-10 px-5 pt-16 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div className="pb-16">
            <p className="eyebrow">{agent.role?.displayName ?? "Agent"}</p>
            <h1 className="mt-6 font-display text-7xl font-black uppercase leading-[0.82] tracking-[-0.075em] sm:text-9xl">
              {agent.displayName}
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-[var(--muted)]">
              {agent.description}
            </p>
          </div>
          <div className="relative min-h-[36rem]">
            <Image
              src={agent.fullPortrait ?? agent.displayIcon}
              alt={`${agent.displayName} full portrait`}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-contain object-bottom drop-shadow-[0_22px_36px_rgba(0,0,0,0.45)]"
            />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        <p className="eyebrow">Abilities</p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {agent.abilities.map((ability) => (
            <div
              key={`${ability.slot}-${ability.displayName}`}
              className="valorant-panel group p-7"
            >
              <div className="flex items-center gap-5">
                {ability.displayIcon ? (
                  <Image
                    src={ability.displayIcon}
                    alt=""
                    width={52}
                    height={52}
                    className="size-13 object-contain transition group-hover:scale-110"
                  />
                ) : (
                  <span className="grid size-13 place-items-center border border-white/15 font-mono">
                    {ability.slot.slice(0, 1)}
                  </span>
                )}
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--accent)]">
                    {ability.slot}
                  </p>
                  <h2 className="font-display text-2xl font-black uppercase">
                    {ability.displayName}
                  </h2>
                </div>
              </div>
              <p className="mt-5 text-sm leading-7 text-[var(--muted)]">
                {ability.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </article>
  );
}
