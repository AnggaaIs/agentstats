import type { Metadata } from "next";

import { CatalogBrowser } from "@/components/catalog-browser";
import { PageHeading } from "@/components/page-heading";
import {
  getCurrentFavoritesOrEmpty,
  toFavoriteScope,
} from "@/lib/community";
import { createMetadata } from "@/lib/seo";
import { getAgents } from "@/lib/valorant-api";

export const metadata: Metadata = createMetadata({
  title: "Valorant Agents, Roles & Abilities",
  description:
    "Explore every playable Valorant agent, role, ability kit, portrait, and combat style in the current roster.",
  path: "/agents",
});

export default async function AgentsPage() {
  const [agents, favorites] = await Promise.all([
    getAgents(),
    getCurrentFavoritesOrEmpty(),
  ]);

  return (
    <section className="mx-auto max-w-[86rem] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <PageHeading
        eyebrow={`${agents.length} agents`}
        title="Choose an agent"
        description="Explore every role, combat style, and ability kit."
      />
      <CatalogBrowser
        items={agents.map((agent) => ({
          id: agent.uuid,
          href: `/agents/${agent.uuid}`,
          image: agent.fullPortrait ?? agent.displayIcon,
          title: agent.displayName,
          meta: agent.role?.displayName ?? "No role",
          metaIcon: agent.role?.displayIcon,
          group: agent.role?.displayName ?? "Other",
          favoriteScope: toFavoriteScope(
            agent.role?.displayName ?? "other",
          ),
        }))}
        groups={[...new Set(agents.map((agent) => agent.role?.displayName ?? "Other"))]}
        groupIcons={Object.fromEntries(
          agents.flatMap((agent) =>
            agent.role
              ? [[agent.role.displayName, agent.role.displayIcon]]
              : [],
          ),
        )}
        paginate={false}
        searchPlaceholder="Search agents or roles"
        favoriteCategory="agent"
        initialFavoriteIds={favorites.agent}
      />
    </section>
  );
}
