import type { Metadata } from "next";

import { LegalPage } from "@/components/legal-page";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Disclaimer",
  description:
    "Important information about AgentStats, Riot Games, and data accuracy.",
  path: "/disclaimer",
});

export default function DisclaimerPage() {
  return (
    <LegalPage
      title="Disclaimer"
      description="AgentStats is an independent statistics project, not an official Riot Games service."
    >
      <h2>Independent project</h2>
      <p>
        AgentStats isn&apos;t endorsed by Riot Games and doesn&apos;t reflect
        the views or opinions of Riot Games or anyone officially involved in
        producing or managing Riot Games properties. Riot Games, and all
        associated properties are trademarks or registered trademarks of Riot
        Games, Inc.
      </p>
      <p>
        Valorant, Riot Games, and their associated logos, artwork, game content,
        and trademarks belong to Riot Games. Other names and marks belong to
        their respective owners.
      </p>

      <h2>Information and availability</h2>
      <p>
        Player statistics and game content may come from Riot Games,
        valorant-api.com, cached responses, or other identified public sources.
        valorant-api.com is an independent, unofficial content API and is not
        Riot Games. Information can be delayed, incomplete, unavailable, or
        different from what appears in the game. AgentStats does not guarantee
        accuracy or continuous access.
      </p>

      <h2>Player permission</h2>
      <p>
        Riot requires player-specific statistics and match history to use an
        approved opt-in flow through Riot Sign On. Until that integration is
        approved and active, AgentStats must not present personal gameplay data
        as publicly available merely because a Riot ID can be found.
      </p>

      <h2>Aggregate statistics</h2>
      <p>
        Pick rates, win rates, competitive picks by rank, performance averages,
        and map frequency are estimates from the available sample of consenting
        AgentStats users. They do not represent every Valorant player or match,
        and small or uneven samples can produce unstable results. These metrics
        should be read with the sample counts shown by the service.
      </p>
      <p>
        Agent pick, rank, team-result, and map aggregates may include minimal
        match context from other participants in a consenting user&apos;s match.
        Player-specific profiles and performance statistics still require that
        player&apos;s own opt-in.
      </p>

      <h2>No official or professional advice</h2>
      <p>
        AgentStats is for general information and entertainment. It does not
        provide official competitive rulings, account support, coaching,
        financial advice, betting advice, or any guarantee of gameplay results.
      </p>
      <p>
        Automated coaching findings, session comparisons, improvement targets,
        and team summaries are inferences from limited available match data.
        They can miss game context, communication, role assignments, connection
        issues, or player intent and should not be treated as a definitive
        evaluation of a player.
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
        , including product registration and player opt-in requirements. Riot
        Games may change those policies or withdraw permissions independently
        of AgentStats.
      </p>
    </LegalPage>
  );
}
