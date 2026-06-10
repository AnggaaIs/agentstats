import type { Metadata } from "next";

import { ClearLocalData } from "@/components/clear-local-data";
import { LegalContact } from "@/components/legal-contact";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Cookie Notice",
  description:
    "Learn about cookies and browser storage used by AgentStats.",
};

export default function CookiesPage() {
  return (
    <LegalPage
      title="Cookie notice"
      description="AgentStats keeps its browser storage deliberately small. This notice explains what is used today."
    >
      <h2>Current use</h2>
      <p>
        AgentStats does not set advertising or audience measurement cookies. A
        strictly necessary cookie is used only when you participate in
        Community Favorites. It gives the browser a protected random
        identifier so one active agent choice can be maintained per role,
        alongside one map, one weapon, and one skin choice per weapon.
        Repeated voting can be limited.
      </p>
      <p>
        The service uses browser storage, which is different from a cookie, to
        keep up to five recent player searches on your device. This helps you
        return to a previous search. The list is not used for advertising or
        cross-site tracking.
      </p>
      <ClearLocalData />

      <h2>Community voting control</h2>
      <p>
        Removing site cookies from your browser removes the local voting
        identifier. To also remove the related choices from AgentStats, use the
        “Clear my favorites” control on the Community page before clearing
        browser data.
      </p>

      <h2>Service providers</h2>
      <p>
        A hosting, delivery, or security provider may use strictly necessary
        technology to deliver pages, balance traffic, prevent abuse, or protect
        the service. Any such use depends on the provider and deployment
        settings.
      </p>

      <h2>Your browser controls</h2>
      <p>
        You can remove stored site data through your browser settings. Blocking
        all browser storage may affect convenience features, but the public
        reference pages should remain usable.
      </p>

      <h2>Future changes</h2>
      <p>
        If AgentStats later adds optional cookies or similar tracking
        technology, this notice will be updated and a choice will be requested
        where the law requires it.
      </p>

      <h2>Contact</h2>
      <LegalContact />
    </LegalPage>
  );
}
