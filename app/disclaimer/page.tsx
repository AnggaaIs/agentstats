import type { Metadata } from "next";

import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Disclaimer",
  description:
    "Important information about AgentStats, Riot Games, and data accuracy.",
};

export default function DisclaimerPage() {
  return (
    <LegalPage
      title="Disclaimer"
      description="AgentStats is an independent statistics project, not an official Riot Games service."
    >
      <h2>Independent project</h2>
      <p>
        AgentStats was created under Riot Games&apos; “Legal Jibber Jabber”
        policy using assets owned by Riot Games. Riot Games does not endorse or
        sponsor this project.
      </p>
      <p>
        Valorant, Riot Games, and their associated logos, artwork, game content,
        and trademarks belong to Riot Games. Other names and marks belong to
        their respective owners.
      </p>

      <h2>Information and availability</h2>
      <p>
        Player statistics and game content may come from Riot Games,
        valorant-api.com, cached responses, or public sources. Information can
        be delayed, incomplete, unavailable, or different from what appears in
        the game. AgentStats does not guarantee accuracy or continuous access.
      </p>

      <h2>No official or professional advice</h2>
      <p>
        AgentStats is for general information and entertainment. It does not
        provide official competitive rulings, account support, coaching,
        financial advice, betting advice, or any guarantee of gameplay results.
      </p>

      <h2>Third-party services</h2>
      <p>
        Links and information from other services are provided for convenience.
        AgentStats does not control their content, availability, security, or
        policies.
      </p>

      <h2>Riot policies</h2>
      <p>
        This project is intended to follow the{" "}
        <a href="https://www.riotgames.com/en/legal">
          Riot Games Legal Jibber Jabber
        </a>{" "}
        and the{" "}
        <a href="https://developer.riotgames.com/docs/valorant">
          Riot Games Valorant developer policies
        </a>
        . Riot Games may change those policies or withdraw permissions
        independently of AgentStats.
      </p>
    </LegalPage>
  );
}
