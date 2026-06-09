import type { Metadata } from "next";

import { LegalContact } from "@/components/legal-contact";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "The terms that apply when you access or use AgentStats.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of use"
      description="These terms apply when you visit or use AgentStats. By using the service, you agree to follow them."
    >
      <h2>The service</h2>
      <p>
        AgentStats provides public Valorant game information, player lookup,
        statistics, and reference content. Features may be added, changed,
        limited, or removed at any time.
      </p>
      <p>
        AgentStats is an independent project. It is not Riot Games, is not
        endorsed by Riot Games, and does not provide access to or control over
        Riot accounts.
      </p>

      <h2>Who may use AgentStats</h2>
      <p>
        You must be legally able to agree to these terms. If you are not old
        enough to do so where you live, a parent or guardian must approve your
        use of the service.
      </p>

      <h2>Permission to use the service</h2>
      <p>
        You may use AgentStats for lawful personal use while these terms are
        followed. This permission is limited, non-exclusive, and may be
        withdrawn when necessary to protect the service, its users, or others.
      </p>

      <h2>Your responsibilities</h2>
      <p>
        You are responsible for the searches and actions you make through
        AgentStats. Player names and identifiers should only be used for lawful
        purposes and must not be used to harass, threaten, impersonate, expose,
        or harm another person.
      </p>
      <p>
        Community Favorites are intended for genuine personal preferences. You
        may not automate votes, create artificial voting identities, evade
        voting limits, or coordinate manipulation of a ranking.
      </p>
      <p>
        The separate <a href="/acceptable-use">Acceptable Use Policy</a> is part
        of these terms.
      </p>

      <h2>Riot Games and other services</h2>
      <p>
        AgentStats relies on information and services supplied by Riot Games
        and other providers. Your use of those services may also be governed by
        their own terms and privacy notices. AgentStats cannot control their
        availability, accuracy, policies, or decisions.
      </p>

      <h2>Ownership</h2>
      <p>
        AgentStats owns its original layout, writing, and service code. Riot
        Games owns the Valorant name, game content, artwork, trademarks, and
        related rights. Other names and materials belong to their respective
        owners. Nothing in these terms transfers those rights to you.
      </p>

      <h2>Availability and accuracy</h2>
      <p>
        The service is provided on an “as available” basis. Statistics may be
        delayed, incomplete, unavailable, or different from information shown
        in the game. AgentStats does not promise uninterrupted access, perfect
        accuracy, or that every feature will remain available.
      </p>

      <h2>Suspension and ending access</h2>
      <p>
        Access may be limited or ended when these terms are violated, when use
        creates risk or harm, when a provider requires it, or when the service
        is discontinued. You may stop using AgentStats at any time.
      </p>

      <h2>Responsibility for loss</h2>
      <p>
        To the fullest extent allowed by law, AgentStats and its operator are
        not responsible for indirect, incidental, special, consequential, or
        punitive loss arising from the service. Nothing in these terms excludes
        responsibility that cannot legally be excluded, including mandatory
        consumer rights.
      </p>

      <h2>Disputes and applicable law</h2>
      <p>
        Before starting a formal dispute, please contact the operator and allow
        a reasonable opportunity to resolve the issue. These terms are governed
        by the laws applicable to the operator, without removing any mandatory
        protection you have under the laws where you live.
      </p>

      <h2>Changes to these terms</h2>
      <p>
        Revised terms may be published when the service or legal requirements
        change. Continued use after a revision takes effect means the revised
        terms apply, where permitted by law.
      </p>

      <h2>Contact</h2>
      <LegalContact />
    </LegalPage>
  );
}
