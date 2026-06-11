import type { Metadata } from "next";

import { ClearLocalData } from "@/components/clear-local-data";
import { LegalContact } from "@/components/legal-contact";
import { LegalPage } from "@/components/legal-page";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Privacy Policy",
  description:
    "Learn what player, community voting, browser, and service information AgentStats handles and the privacy choices available to you.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy policy"
      description="This policy explains what information AgentStats receives, why it is used, and the choices available to you."
    >
      <h2>Information AgentStats handles</h2>
      <p>
        When player lookup is available, AgentStats receives the Riot ID,
        tagline, and region entered in the search form. It uses that
        information to request account routing information from Riot Games.
        Official leaderboard placement may be shown from Riot&apos;s public
        ladder data.
      </p>
      <p>
        Personal match history and derived player statistics may only be
        displayed after the player has opted in through Riot Sign On and Riot
        has approved the integration. AgentStats must not make a player&apos;s
        personal gameplay data available to other people before that player
        has linked their own account.
      </p>
      <p>
        When you connect through Riot Sign On, AgentStats stores a user
        record containing your Riot PUUID, current Riot ID, selected region,
        profile visibility, consent status, and account timestamps. A random
        database session identifier keeps you signed in. AgentStats does not
        receive your Riot password and does not retain Riot OAuth access or
        refresh tokens after account verification.
      </p>
      <p>
        AgentStats also displays public game content supplied by
        valorant-api.com, an independent third-party content API, such as
        agent, weapon, map, season, and cosmetic information. Requests for
        this static content do not include your Riot ID. Platform incidents
        and maintenance notices come from Riot&apos;s official status API.
      </p>

      <h3>Community favorites</h3>
      <p>
        You can choose one favorite agent per role, plus a favorite map and
        weapon, and one favorite skin for each weapon without creating an
        account. AgentStats places a protected random identifier in your
        browser and stores a one-way version with each choice. It does not
        contain your name, Riot account, or email address.
      </p>
      <p>
        A one-way version of the network address used for a vote is kept in a
        activity record for up to about 30 days to limit repeated changes and unusual voting
        bursts. The original address is not stored in the community voting
        database. Activity records are used only for security and vote
        integrity.
      </p>

      <h3>Information kept on your device</h3>
      <p>
        Up to five recent player searches are kept in your browser so you can
        return to them quickly. This list stays on that device until newer
        searches replace it, you clear it, or the browser removes its stored
        data.
      </p>
      <ClearLocalData />

      <h3>Service records</h3>
      <p>
        The hosting and security services used to run AgentStats may create
        standard records such as an internet address, browser type, requested
        page, time, and error details. These records are used to keep the
        service secure, reliable, and available.
      </p>
      <p>
        AgentStats does not accept payments, display advertising, or use
        audience-tracking tools.
      </p>

      <h2>Why information is used</h2>
      <ul>
        <li>To return the player information and game content you request.</li>
        <li>To remember recent searches on your device.</li>
        <li>To protect the service and investigate errors or misuse.</li>
        <li>To count community favorites and limit manipulated voting.</li>
        <li>To meet legal obligations and enforce the service rules.</li>
      </ul>
      <p>
        Where the law requires a legal reason, processing may rely on your
        request for the service, legitimate interests in operating and
        protecting it, consent where requested, or a legal obligation.
      </p>

      <h2>Who receives information</h2>
      <p>
        Player search details are sent to Riot Games so the requested account
        can be routed and, where an approved opt-in is present, the requested
        game information can be returned. Hosting, delivery, and security
        providers may handle service records on behalf of AgentStats.
        Information may also be disclosed when required by law or needed to
        protect people, rights, or the service.
      </p>
      <p>
        AgentStats does not sell personal information or share it for targeted
        advertising.
      </p>

      <h2>Storage and retention</h2>
      <p>
        Recent searches remain in your browser until you clear them or your
        browser removes its stored data. AgentStats briefly holds some Riot and
        game content responses to improve speed and reduce repeated requests.
        Account and match-list results are generally refreshed within minutes,
        leaderboard results within about ten minutes, and public game content
        within about one day. A completed match record may be retained longer
        because it does not normally change.
      </p>
      <p>
        A community favorite remains until it is changed or removed. The
        Community page provides a control to remove all choices associated
        with the current browser. Anonymous security activity may be retained
        for up to about 30 days to investigate voting abuse.
      </p>
      <p>
        A linked account remains until you disconnect it. Disconnecting from
        the account page deletes the AgentStats user record, Riot connection,
        consent record, and active sessions. Making a profile private
        immediately withdraws permission for other visitors to view its
        personal match statistics.
      </p>
      <p>
        Hosting and security records are retained according to the provider
        settings and only as long as reasonably needed for security,
        reliability, legal obligations, or disputes.
      </p>

      <h2>International handling</h2>
      <p>
        Riot Games and service providers may operate in more than one country.
        Information may therefore be handled outside your country. Where
        required, appropriate protections will be used for those transfers.
      </p>

      <h2>Your choices and rights</h2>
      <p>
        Depending on where you live, you may have rights to ask what
        information is held about you, request correction or deletion, receive
        a copy, object to or limit certain uses, withdraw consent, or complain
        to a privacy authority. AgentStats may need to verify your request
        before acting on it.
      </p>
      <p>
        Riot Games controls Riot accounts and the source game records. Requests
        to change an account or source record should be directed to Riot Games.
        See the{" "}
        <a href="https://www.riotgames.com/en/privacy-notice">
          Riot Games Privacy Notice
        </a>
        .
      </p>

      <h2>Children</h2>
      <p>
        AgentStats is not directed to children below the minimum age required
        to consent to an online service where they live. If you believe a
        child has provided information that should be removed, contact the
        operator.
      </p>

      <h2>Security</h2>
      <p>
        Reasonable safeguards are used to protect information, but no internet
        service can guarantee absolute security.
      </p>

      <h2>Policy changes</h2>
      <p>
        This policy may change when AgentStats changes. The effective date at
        the top of this page will be updated when a revised policy is
        published.
      </p>

      <h2>Contact</h2>
      <LegalContact />
    </LegalPage>
  );
}
