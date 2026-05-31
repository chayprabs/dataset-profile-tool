import type { Metadata } from "next";
import { LegalSection } from "../../components/legal-section";
import {
  LEGAL_LAST_UPDATED,
  OPERATOR_GITHUB,
  OPERATOR_NAME,
  OPERATOR_WEBSITE,
  PRODUCT_NAME
} from "../../lib/legal/operator";

export const metadata: Metadata = {
  title: "Privacy Policy — DataProfile",
  description: "Privacy policy for the DataProfile online dataset profiling tool."
};

export default function PrivacyPage() {
  return (
    <main className="site-main legal-page">
      <h1>Privacy Policy</h1>
      <p>Last updated: {LEGAL_LAST_UPDATED}</p>

      <LegalSection title="Important notice">
        <p>
          This Privacy Policy describes how {PRODUCT_NAME} (&quot;we&quot;, &quot;us&quot;, &quot;the
          Service&quot;) handles information when you use the hosted website, API, or related
          features. It is not legal advice. No policy can guarantee immunity from claims in every
          jurisdiction; where mandatory law gives you rights that cannot be waived, those rights
          remain unaffected.
        </p>
      </LegalSection>

      <LegalSection title="Who we are">
        <p>
          The data controller for the public hosted Service is {OPERATOR_NAME} (&quot;Operator&quot;).
          Contact:{" "}
          <a href={OPERATOR_WEBSITE} rel="noopener noreferrer">
            {OPERATOR_WEBSITE.replace("https://", "")}
          </a>
          . Source code:{" "}
          <a href={OPERATOR_GITHUB} rel="noopener noreferrer">
            GitHub repository
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="Scope">
        <p>
          This policy applies to use of the Operator&apos;s hosted {PRODUCT_NAME} instance. If you
          self-host the open-source software, you (or your organization) are the controller of data
          processed on your infrastructure; this policy does not govern your deployment unless you
          choose to adopt it.
        </p>
      </LegalSection>

      <LegalSection title="Information we process">
        <ul>
          <li>
            <strong>Content you submit:</strong> files uploaded, URLs you provide, and derived
            outputs (profiles, inferred JSON Schema, drift reports, samples, warnings).
          </li>
          <li>
            <strong>Share snapshots:</strong> if you create a share link, a read-only copy of a
            report may be stored until its TTL expires, then deleted.
          </li>
          <li>
            <strong>Technical data:</strong> IP address, request timestamps, HTTP headers (such as
            User-Agent), error logs, and security-related metadata needed to operate and protect the
            Service.
          </li>
          <li>
            <strong>No accounts required:</strong> we do not require sign-in for basic profiling; we
            do not intentionally collect passwords or payment card data through {PRODUCT_NAME}.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="What we do not do">
        <ul>
          <li>We do not sell your personal information.</li>
          <li>
            We do not use your uploaded datasets to train third-party machine-learning models for
            advertising or unrelated products.
          </li>
          <li>
            The open-source application does not embed third-party advertising or behavioral
            analytics trackers in the codebase distributed in this repository.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Purposes and legal bases (EEA/UK)">
        <p>Where the GDPR or UK GDPR applies, we rely on the following bases:</p>
        <ul>
          <li>
            <strong>Performance of a contract / steps at your request:</strong> to process uploads
            and URLs and return the profiling results you ask for.
          </li>
          <li>
            <strong>Legitimate interests:</strong> to secure the Service, prevent abuse, enforce
            limits, debug failures, and improve reliability — balanced against your rights.
          </li>
          <li>
            <strong>Legal obligation:</strong> where we must retain or disclose information to comply
            with applicable law or valid legal process.
          </li>
          <li>
            <strong>Consent:</strong> only where we explicitly ask for it (for example optional
            communications not required to run profiling).
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Retention">
        <p>
          Uploads, job artifacts, and temporary working files are kept only for a short TTL (often
          minutes; configurable on self-hosted installs) and are automatically deleted afterward.
          Share links expire when their TTL elapses. Server logs may be retained for a limited period
          for security and operations, then rotated or deleted.
        </p>
      </LegalSection>

      <LegalSection title="Security">
        <p>
          We use reasonable technical and organizational measures appropriate to a free,
          best-effort tool (transport encryption where deployed with TLS, access controls on
          infrastructure, size limits, and automated cleanup). No method of transmission or storage
          is completely secure. You use the Service at your own risk for sensitive data.
        </p>
      </LegalSection>

      <LegalSection title="International transfers">
        <p>
          Infrastructure providers may process data in countries other than your own. Where required,
          we rely on appropriate safeguards (such as standard contractual clauses) or other lawful
          transfer mechanisms offered by our providers.
        </p>
      </LegalSection>

      <LegalSection title="Subprocessors and infrastructure">
        <p>
          Hosted deployments may use cloud hosting, object storage, CDNs, or logging services that
          process data solely to deliver the Service. Their processing is governed by their terms and
          our instructions as applicable.
        </p>
      </LegalSection>

      <LegalSection title="PII and regulated data">
        <p>
          The Service may heuristically flag columns that resemble emails, phone numbers, or similar
          patterns. That detection is informational, not a compliance certification.{" "}
          <strong>You are solely responsible</strong> for ensuring you have a lawful basis to upload
          data (including personal data, health data, financial data, or children&apos;s data) and
          for choosing self-hosting or on-premises processing when your policies require it.
        </p>
      </LegalSection>

      <LegalSection title="Your rights">
        <p>
          Depending on your location, you may have rights to access, correct, delete, restrict,
          object to, or port personal data we hold about you, and to withdraw consent where
          processing is consent-based. You may also lodge a complaint with a supervisory authority in
          the EEA/UK or with a regulator in your country.
        </p>
        <p>
          <strong>California (CCPA/CPRA):</strong> we do not sell or share personal information for
          cross-context behavioral advertising as those terms are commonly defined. You may request
          access or deletion of personal information we hold about you, subject to exceptions. We
          do not discriminate against you for exercising privacy rights.
        </p>
        <p>
          To exercise rights, contact us via{" "}
          <a href={OPERATOR_WEBSITE} rel="noopener noreferrer">
            {OPERATOR_WEBSITE.replace("https://", "")}
          </a>
          . We may need to verify your request. Some rights may be limited where we cannot identify
          you from ephemeral processing alone.
        </p>
      </LegalSection>

      <LegalSection title="Children">
        <p>
          The Service is not directed to children under 16 (or the higher age required in your
          country). We do not knowingly collect personal information from children. If you believe a
          child has provided personal data, contact us to request deletion.
        </p>
      </LegalSection>

      <LegalSection title="Automated decision-making">
        <p>
          Profiling statistics and drift classifications are generated automatically for your review.
          They do not produce legal or similarly significant effects about you as an individual
          without human involvement.
        </p>
      </LegalSection>

      <LegalSection title="Security incidents">
        <p>
          If we become aware of a personal data breach likely to pose a risk to your rights, we will
          take reasonable steps consistent with applicable law, which may include notification to you
          or regulators where required.
        </p>
      </LegalSection>

      <LegalSection title="Relationship to Terms">
        <p>
          Use of the Service is also governed by our{" "}
          <a href="/terms">Terms &amp; Conditions</a>, including disclaimers and limitations of
          liability to the fullest extent permitted by law. Mandatory consumer protections in your
          jurisdiction are not excluded.
        </p>
      </LegalSection>

      <LegalSection title="Changes">
        <p>
          We may update this policy by posting a revised version with a new &quot;Last updated&quot;
          date. Material changes may be highlighted on the site. Continued use after the effective
          date constitutes acceptance where permitted by law.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Privacy questions:{" "}
          <a href={OPERATOR_WEBSITE} rel="noopener noreferrer">
            {OPERATOR_WEBSITE}
          </a>
          .
        </p>
      </LegalSection>
    </main>
  );
}
