import type { Metadata } from "next";

import { ClearLocalData } from "@/components/clear-local-data";
import { LegalContact } from "@/components/legal-contact";
import { LegalPage } from "@/components/legal-page";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Data Requests",
  description:
    "Request access, correction, deletion, or information about data handled by AgentStats.",
  path: "/data-requests",
});

export default function DataRequestsPage() {
  return (
    <LegalPage
      title="Data requests"
      description="Manage information kept on your device or contact the operator about a privacy request."
    >
      <h2>Clear recent searches</h2>
      <p>
        Recent searches are kept in your browser. You can remove them
        immediately with the control below without sending a request.
      </p>
      <ClearLocalData />

      <h2>Send a request</h2>
      <p>
        Depending on where you live, you may ask to access, correct, delete, or
        receive a copy of personal information handled by AgentStats. You may
        also object to or limit certain uses.
      </p>
      <p>
        In your message, state the right you want to use, your country or
        region, and enough detail to locate the relevant information. Do not
        send a Riot password, access code, payment information, government
        identifier, or other unnecessary sensitive information.
      </p>
      <LegalContact />

      <h2>Verification and response</h2>
      <p>
        The operator may ask for reasonable information to confirm that the
        request relates to you. Requests will be answered within the period
        required by applicable law. A request may be limited or refused where
        the law permits, with an explanation where required.
      </p>

      <h2>Riot account and game records</h2>
      <p>
        AgentStats does not control Riot accounts or the original game records
        supplied by Riot Games. To access, correct, or delete information held
        by Riot Games, use the privacy choices described in the{" "}
        <a href="https://www.riotgames.com/en/privacy-notice">
          Riot Games Privacy Notice
        </a>
        .
      </p>
    </LegalPage>
  );
}
