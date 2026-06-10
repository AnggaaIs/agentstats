import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { AgentRoleLabel } from "@/components/agent-role-label";
import { FavoriteButton } from "@/components/favorite-button";
import { getCurrentFavorites, toFavoriteScope } from "@/lib/community";
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
  let favorites;

  try {
    [agent, favorites] = await Promise.all([
      getAgent(uuid),
      getCurrentFavorites(),
    ]);
  } catch {
    notFound();
  }
  const favoriteScope = toFavoriteScope(agent.role?.displayName ?? "other");

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
        <div className="mx-auto grid max-w-7xl items-end gap-0 px-5 pt-10 lg:min-h-[42rem] lg:grid-cols-[0.8fr_1.2fr] lg:gap-10 lg:px-8 lg:pt-16">
          <div className="motion-rise pb-4 lg:pb-16">
            <p className="eyebrow">
              <AgentRoleLabel
                name={agent.role?.displayName ?? "Agent"}
                icon={agent.role?.displayIcon}
              />
            </p>
            <h1 className="mt-5 font-display text-6xl font-black uppercase leading-[0.82] tracking-[-0.075em] sm:text-8xl lg:mt-6 lg:text-9xl">
              {agent.displayName}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-[var(--muted)] sm:text-lg sm:leading-8 lg:mt-7">
              {agent.description}
            </p>
            <FavoriteButton
              category="agent"
              scopeKey={favoriteScope}
              targetId={agent.uuid}
              targetName={agent.displayName}
              selected={favorites.agent[favoriteScope] === agent.uuid}
              className="mt-7"
            />
          </div>
          <div className="motion-agent relative h-[25rem] sm:h-[31rem] lg:h-auto lg:min-h-[36rem]">
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
        <div className="motion-stagger mt-8 grid gap-4 md:grid-cols-2">
          {agent.abilities.map((ability) => (
            <div
              key={`${ability.slot}-${ability.displayName}`}
              className="ability-card valorant-panel motion-card group p-7"
            >
              <div className="flex items-center gap-5">
                {ability.displayIcon ? (
                  <Image
                    src={ability.displayIcon}
                    alt=""
                    width={52}
                    height={52}
                    className="ability-icon size-13 object-contain"
                  />
                ) : (
                  <span className="grid size-13 place-items-center border border-white/15 font-mono">
                    {ability.slot.slice(0, 1)}
                  </span>
                )}
                <div className="ability-heading">
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
