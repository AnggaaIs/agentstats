import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { AgentRoleLabel } from "@/components/agent-role-label";
import { FavoriteButton } from "@/components/favorite-button";
import { JsonLd } from "@/components/json-ld";
import {
  getCurrentFavoritesOrEmpty,
  getCommunityCountsOrEmpty,
  toFavoriteScope,
} from "@/lib/community";
import {
  absoluteUrl,
  breadcrumbJsonLd,
  createMetadata,
} from "@/lib/seo";
import { getAgent, ValorantApiError } from "@/lib/valorant-api";

interface AgentPageProps {
  params: Promise<{ uuid: string }>;
}

export async function generateMetadata({
  params,
}: AgentPageProps): Promise<Metadata> {
  try {
    const { uuid } = await params;
    const agent = await getAgent(uuid);
    return createMetadata({
      title: `${agent.displayName} - Abilities, Role & Agent Guide`,
      description: `${agent.displayName} is a ${agent.role?.displayName ?? "Valorant agent"}. Explore their biography, role, abilities, icons, and official Valorant artwork.`,
      path: `/agents/${uuid}`,
      image: agent.fullPortrait ?? agent.displayIcon,
      imageAlt: `${agent.displayName} Valorant agent`,
      type: "profile",
    });
  } catch {
    return createMetadata({
      title: "Agent not found",
      path: "/agents",
      noIndex: true,
    });
  }
}

export default async function AgentPage({ params }: AgentPageProps) {
  const { uuid } = await params;
  let agent;
  let favorites;
  let favoriteCounts;

  try {
    [agent, favorites, favoriteCounts] = await Promise.all([
      getAgent(uuid),
      getCurrentFavoritesOrEmpty(),
      getCommunityCountsOrEmpty("agent"),
    ]);
  } catch (error) {
    if (error instanceof ValorantApiError && error.status === 404) notFound();
    throw error;
  }
  const favoriteScope = toFavoriteScope(agent.role?.displayName ?? "other");

  return (
    <article>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Valorant Agents", path: "/agents" },
            { name: agent.displayName, path: `/agents/${agent.uuid}` },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "VideoGameCharacter",
            name: agent.displayName,
            description: agent.description,
            image: agent.fullPortrait ?? agent.displayIcon,
            url: absoluteUrl(`/agents/${agent.uuid}`),
            game: {
              "@type": "VideoGame",
              name: "Valorant",
            },
          },
        ]}
      />
      <header className="relative isolate overflow-hidden border-b border-white/8 bg-[#111820]">
        {agent.background ? (
          <Image
            src={agent.background}
            alt=""
            fill
            sizes="100vw"
            className="-z-20 object-cover opacity-10"
          />
        ) : null}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0b1016] via-[#0b1016]/80 to-transparent" />
        <div className="mx-auto grid max-w-[86rem] items-end gap-0 px-4 pt-8 sm:px-6 lg:min-h-[31rem] lg:grid-cols-[0.82fr_1.18fr] lg:gap-8 lg:px-8 lg:pt-10">
          <div className="motion-rise pb-4 lg:pb-10">
            <p className="eyebrow">
              <AgentRoleLabel
                name={agent.role?.displayName ?? "Agent"}
                icon={agent.role?.displayIcon}
              />
            </p>
            <h1 className="mt-4 font-display text-5xl font-black uppercase leading-[0.84] tracking-[-0.065em] sm:text-6xl lg:text-7xl">
              {agent.displayName}
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-[var(--muted)] sm:text-base lg:mt-5">
              {agent.description}
            </p>
            <FavoriteButton
              category="agent"
              scopeKey={favoriteScope}
              targetId={agent.uuid}
              targetName={agent.displayName}
              selected={favorites.agent[favoriteScope] === agent.uuid}
              voteCount={
                favoriteCounts.find((count) => count.targetId === agent.uuid)
                  ?.votes ?? 0
              }
              className="mt-5"
            />
          </div>
          <div className="motion-agent relative h-[21rem] sm:h-[25rem] lg:h-auto lg:min-h-[28rem]">
            <Image
              src={agent.fullPortrait ?? agent.displayIcon}
              alt={`${agent.displayName} full portrait`}
              fill
              loading="eager"
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-contain object-bottom drop-shadow-[0_22px_36px_rgba(0,0,0,0.45)]"
            />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[86rem] px-4 py-9 sm:px-6 lg:px-8 lg:py-11">
        <p className="eyebrow">Abilities</p>
        <div className="motion-stagger mt-6 grid gap-3 md:grid-cols-2">
          {agent.abilities.map((ability) => (
            <div
              key={`${ability.slot}-${ability.displayName}`}
              className="ability-card valorant-panel motion-card group p-5"
            >
              <div className="flex items-center gap-4">
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
                  <h2 className="font-display text-xl font-black uppercase">
                    {ability.displayName}
                  </h2>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
                {ability.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </article>
  );
}
