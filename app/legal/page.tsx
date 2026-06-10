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
