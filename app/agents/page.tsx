import type { Metadata } from "next";

import { CatalogBrowser } from "@/components/catalog-browser";
import { PageHeading } from "@/components/page-heading";
import { getAgents } from "@/lib/valorant-api";

export const metadata: Metadata = {
  title: "Agents",
  description: "Explore every playable Valorant agent, role, and ability.",
};

export default async function AgentsPage() {
  const agents = await getAgents();

  return (
    <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
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
          group: agent.role?.displayName ?? "Other",
        }))}
        groups={[...new Set(agents.map((agent) => agent.role?.displayName ?? "Other"))]}
        perPage={12}
        searchPlaceholder="Search agents or roles"
      />
    </section>
  );
}
