import type { Metadata } from "next";

import { LegalContact } from "@/components/legal-contact";
import { LegalPage } from "@/components/legal-page";
import { RouteLink } from "@/components/route-link";
import { LEGAL_LINKS } from "@/lib/legal";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Legal Overview",
  description:
    "Legal information for AgentStats, including privacy, terms, cookies, acceptable use, and data requests.",
  path: "/legal",
});

export default function LegalOverviewPage() {
  return (
    <LegalPage
      title="Legal overview"
      description="The rules and notices that explain how AgentStats works, what data it handles, and how you can use it."
    >
      <p>
        AgentStats is an independent Valorant statistics project. These
        documents describe the service as it operates today. They may be
        updated when features, providers, or legal requirements change.
      </p>
      <p>
        Riot Sign On requires permission to process the connecting
        player&apos;s own match data for private player tools and pseudonymized
        aggregate analytics. Making a profile public remains a separate,
        optional choice.
      </p>
      <p>
        Authenticated players can also create improvement plans and private
        match journals, publish revocable performance snapshots, and join
        invite-only team workspaces. Publishing a report and joining a team are
        separate actions; connecting a Riot account does not enable either one
        automatically.
      </p>

      <div className="mt-8 grid gap-px border border-white/10 bg-white/10 sm:grid-cols-2">
        {LEGAL_LINKS.filter((item) => item.href !== "/legal").map((item) => (
          <RouteLink
            key={item.href}
            href={item.href}
            className="bg-[var(--panel)] p-5 font-black uppercase tracking-[0.08em] text-white transition hover:bg-[var(--panel-raised)]"
          >
            {item.label}
          </RouteLink>
        ))}
      </div>

      <h2>Contact</h2>
      <p>
        Questions about these documents or the way AgentStats handles data can
        be sent to:
      </p>
      <LegalContact />
    </LegalPage>
  );
}
