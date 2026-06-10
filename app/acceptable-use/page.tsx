import type { Metadata } from "next";

import { LegalContact } from "@/components/legal-contact";
import { LegalPage } from "@/components/legal-page";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Acceptable Use Policy",
  description:
    "Review the rules for fair, lawful, and responsible use of AgentStats, its community features, APIs, and Valorant data.",
  path: "/acceptable-use",
});

export default function AcceptableUsePage() {
  return (
    <LegalPage
      title="Acceptable use"
      description="Use AgentStats fairly, lawfully, and without harming players, the service, or its providers."
    >
      <h2>Do not misuse the service</h2>
      <p>You may not use AgentStats to:</p>
      <ul>
        <li>Break any law, regulation, court order, or third-party right.</li>
        <li>Harass, threaten, stalk, impersonate, or expose another person.</li>
        <li>
          Collect or publish personal information beyond ordinary public game
          statistics.
        </li>
        <li>
          Overload, disrupt, probe, bypass, or gain unauthorized access to the
          service or its providers.
        </li>
        <li>
          Run automated collection at a volume that harms the service or avoids
          reasonable limits.
        </li>
        <li>
          Automate, duplicate, purchase, exchange, or otherwise manipulate
          Community Favorites votes or rankings.
        </li>
        <li>
          Distribute malware, deceptive material, spam, or harmful
          instructions.
        </li>
        <li>
          Build or support cheats, account theft, match manipulation, betting,
          gambling, or wagering.
        </li>
        <li>
          Scout opponents, identify deliberately hidden players, or expose
          player-specific gameplay data without the player&apos;s opt-in.
        </li>
        <li>
          Resell AgentStats data or present the service as an official Riot
          Games product.
        </li>
        <li>
          Remove ownership notices or misuse Riot Games&apos; trademarks and
          game assets.
        </li>
      </ul>

      <h2>Fair access</h2>
      <p>
        Please respect request limits and temporary service restrictions.
        Attempts to avoid those protections may result in access being limited
        or blocked.
      </p>

      <h2>Enforcement</h2>
      <p>
        AgentStats may investigate suspected misuse and may limit or end access
        when reasonably necessary. Serious or unlawful activity may be
        reported to a service provider or lawful authority.
      </p>

      <h2>Report misuse</h2>
      <p>
        Include the relevant page, player search, time, and a short description
        when reporting suspected misuse.
      </p>
      <LegalContact />
    </LegalPage>
  );
}
