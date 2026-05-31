import type { Metadata } from "next";
import { LegalSection } from "../../components/legal-section";
import {
  LEGAL_LAST_UPDATED,
  OPERATOR_NAME,
  OPERATOR_WEBSITE,
  PRODUCT_NAME,
  SOFTWARE_LICENSE
} from "../../lib/legal/operator";

export const metadata: Metadata = {
  title: "Terms & Conditions — DataProfile",
  description: "Terms and conditions for using the DataProfile dataset profiling tool."
};

export default function TermsPage() {
  return (
    <main className="site-main legal-page">
      <h1>Terms &amp; Conditions</h1>
      <p>Last updated: {LEGAL_LAST_UPDATED}</p>

      <LegalSection title="Agreement">
        <p>
          These Terms &amp; Conditions (&quot;Terms&quot;) are a binding agreement between you
          (&quot;you&quot;, &quot;User&quot;) and {OPERATOR_NAME} (&quot;Operator&quot;,
          &quot;we&quot;, &quot;us&quot;) governing access to and use of {PRODUCT_NAME} (the
          &quot;Service&quot;), including the website, API, share links, and related documentation.
          By accessing or using the Service, you agree to these Terms and our{" "}
          <a href="/privacy">Privacy Policy</a>. If you do not agree, do not use the Service.
        </p>
        <p>
          <strong>Not legal advice.</strong> These Terms are designed to allocate risk for a free,
          open-source tool. They do not guarantee that you or the Operator will never face claims in
          any country. Rights that cannot be limited under mandatory consumer, employment, or data
          protection law remain in full force.
        </p>
      </LegalSection>

      <LegalSection title="Eligibility">
        <p>
          You must be at least 18 years old (or the age of majority in your jurisdiction, if higher)
          and have the legal capacity to enter into these Terms. If you use the Service on behalf of
          an organization, you represent that you have authority to bind that organization.
        </p>
      </LegalSection>

      <LegalSection title="Service description">
        <p>
          {PRODUCT_NAME} profiles tabular and semi-structured datasets (for example CSV, Parquet,
          JSONL, SQLite), infers JSON Schema, compares snapshots for drift, and surfaces data-quality
          hints. Results are generated automatically and are provided for <strong>informational
          purposes only</strong>. They may be incomplete, incorrect, or unsuitable for your use case.
        </p>
      </LegalSection>

      <LegalSection title="Fees">
        <p>
          The hosted Service is currently offered without charge. We may introduce fees or usage caps
          in the future with notice where required by law.
        </p>
      </LegalSection>

      <LegalSection title="Acceptable use">
        <p>You agree that you will not:</p>
        <ul>
          <li>Submit data you lack rights or lawful basis to process;</li>
          <li>
            Upload malware, unlawful content, or data subject to export controls or sanctions you are
            not authorized to handle;
          </li>
          <li>
            Probe, scan, or test vulnerabilities except as permitted by our{" "}
            <a href="https://github.com/chayprabs/dataset-profile-tool/blob/main/SECURITY.md">
              security policy
            </a>
            ;
          </li>
          <li>
            Circumvent rate limits, size limits, authentication, or technical restrictions; scrape
            the Service in a manner that impairs others; or access other users&apos; data;
          </li>
          <li>
            Reverse engineer the Service except where applicable law expressly permits (note: the
            software is open source under {SOFTWARE_LICENSE});
          </li>
          <li>Use the Service in violation of applicable law or third-party rights.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Your data">
        <p>
          You retain ownership of datasets you submit. You grant the Operator a{" "}
          <strong>non-exclusive, worldwide, royalty-free, sublicensable (to infrastructure
          providers only) license</strong> to host, copy, process, transmit, and display your content
          solely as needed to operate the Service, enforce these Terms, and comply with law. That
          license ends when your content is deleted from our systems in accordance with our retention
          practices.
        </p>
        <p>
          You are solely responsible for backups, lawful processing, and decisions made from
          profiling output.
        </p>
      </LegalSection>

      <LegalSection title="No professional advice">
        <p>
          The Service does not provide legal, tax, accounting, medical, security audit, or regulatory
          compliance advice. PII hints and schema suggestions are heuristic, not certifications. You
          remain responsible for GDPR, HIPAA, PCI, SOX, or other obligations applicable to your data.
        </p>
      </LegalSection>

      <LegalSection title="Open-source software">
        <p>
          The {PRODUCT_NAME} source code is licensed under the {SOFTWARE_LICENSE}. Self-hosted copies
          are governed by that license in addition to these Terms for hosted use. See{" "}
          <a href="/license">License</a> and the <code>LICENSE</code> file in the repository.
        </p>
      </LegalSection>

      <LegalSection title="Availability and changes">
        <p>
          The Service is provided on a best-effort basis. We may modify, suspend, or discontinue
          features, impose limits, or perform maintenance without liability. We are not obligated to
          store your data beyond stated retention periods.
        </p>
      </LegalSection>

      <LegalSection title="Disclaimer of warranties">
        <p>
          TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, THE SERVICE AND ALL OUTPUT ARE PROVIDED
          &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, WHETHER
          EXPRESS, IMPLIED, OR STATUTORY, INCLUDING WITHOUT LIMITATION WARRANTIES OF MERCHANTABILITY,
          FITNESS FOR A PARTICULAR PURPOSE, TITLE, NON-INFRINGEMENT, ACCURACY, QUIET ENJOYMENT, AND
          THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE.
        </p>
        <p>
          Some jurisdictions do not allow exclusion of implied warranties; in those jurisdictions,
          the above exclusions apply only to the maximum extent permitted.
        </p>
      </LegalSection>

      <LegalSection title="Limitation of liability">
        <p>
          TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, THE OPERATOR AND ITS AFFILIATES,
          LICENSORS, AND SUPPLIERS WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
          CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES; LOSS OF PROFITS, REVENUE, DATA, GOODWILL, OR
          BUSINESS INTERRUPTION; OR COST OF SUBSTITUTE SERVICES, ARISING OUT OF OR RELATED TO THESE
          TERMS OR THE SERVICE, WHETHER BASED ON WARRANTY, CONTRACT, TORT (INCLUDING NEGLIGENCE),
          STRICT LIABILITY, OR ANY OTHER THEORY, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
        </p>
        <p>
          TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, THE OPERATOR&apos;S TOTAL AGGREGATE
          LIABILITY FOR ALL CLAIMS ARISING OUT OF OR RELATED TO THE SERVICE OR THESE TERMS SHALL NOT
          EXCEED THE GREATER OF (A) ONE HUNDRED U.S. DOLLARS (US $100) OR (B) THE AMOUNTS YOU PAID
          THE OPERATOR FOR THE SERVICE IN THE TWELVE (12) MONTHS BEFORE THE EVENT GIVING RISE TO THE
          CLAIM (TYPICALLY ZERO FOR FREE USE).
        </p>
        <p>
          Nothing in these Terms limits liability for death or personal injury caused by negligence
          where such limitation is prohibited, or for fraud, willful misconduct, or other liability
          that cannot be excluded under mandatory law.
        </p>
      </LegalSection>

      <LegalSection title="Indemnification">
        <p>
          You will defend, indemnify, and hold harmless the Operator and its affiliates, officers,
          and agents from and against any third-party claims, damages, losses, and expenses
          (including reasonable attorneys&apos; fees) arising out of or related to: (a) your data or
          use of output; (b) your violation of these Terms or applicable law; (c) infringement or
          misappropriation of third-party rights by your content; or (d) your negligence or willful
          misconduct. We may assume exclusive defense of any matter subject to indemnification; you
          will cooperate.
        </p>
        <p>
          If you are a consumer in a jurisdiction that prohibits broad indemnities, this section
          applies only to the extent permitted by law.
        </p>
      </LegalSection>

      <LegalSection title="Release">
        <p>
          To the extent permitted by law, you release the Operator from claims arising from other
          users&apos; content or conduct. This release does not apply where prohibited by mandatory
          consumer protection law.
        </p>
      </LegalSection>

      <LegalSection title="Dispute resolution">
        <p>
          <strong>Informal resolution.</strong> Before filing a claim, you agree to contact us via{" "}
          <a href={OPERATOR_WEBSITE} rel="noopener noreferrer">
            {OPERATOR_WEBSITE.replace("https://", "")}
          </a>{" "}
          and attempt in good faith to resolve the dispute for at least thirty (30) days.
        </p>
        <p>
          <strong>Class and representative actions.</strong> Where permitted by law, you and the
          Operator agree that each may bring claims only in an individual capacity, not as a plaintiff
          or class member in any purported class, collective, or representative proceeding.
        </p>
        <p>
          <strong>Arbitration (where permitted).</strong> If informal resolution fails and local law
          allows, disputes may be resolved by binding arbitration on an individual basis under rules
          commonly used for consumer tech services in the Operator&apos;s principal place of
          business, unless you opt out within thirty (30) days of first accepting these Terms by
          written notice to the contact above. Either party may seek injunctive relief in court for
          misuse or IP violations. Consumers in the EEA, UK, Australia, and other regions with
          non-waivable rights to bring actions in local courts retain those rights.
        </p>
      </LegalSection>

      <LegalSection title="Governing law">
        <p>
          These Terms are governed by the laws of the jurisdiction where the Operator primarily
          resides, without regard to conflict-of-law rules that would apply another jurisdiction&apos;s
          substantive law. Courts in that jurisdiction have exclusive venue for disputes not subject
          to arbitration, except where mandatory consumer law requires disputes to be heard in your
          country of residence.
        </p>
      </LegalSection>

      <LegalSection title="Export compliance">
        <p>
          You represent that you are not located in, under control of, or a national of any country or
          person subject to comprehensive embargoes or sanctions, and that you will not use the
          Service in violation of export control or sanctions laws.
        </p>
      </LegalSection>

      <LegalSection title="Force majeure">
        <p>
          We are not liable for failure or delay due to events beyond our reasonable control,
          including natural disasters, war, labor disputes, internet failures, or government actions.
        </p>
      </LegalSection>

      <LegalSection title="Assignment">
        <p>
          You may not assign these Terms without our consent. We may assign these Terms in connection
          with a merger, acquisition, or sale of assets.
        </p>
      </LegalSection>

      <LegalSection title="Severability">
        <p>
          If any provision is held invalid or unenforceable, the remaining provisions remain in
          effect, and the invalid provision will be modified minimally to reflect the parties&apos;
          intent where possible.
        </p>
      </LegalSection>

      <LegalSection title="Entire agreement">
        <p>
          These Terms and the Privacy Policy constitute the entire agreement regarding the hosted
          Service and supersede prior understandings on that subject.
        </p>
      </LegalSection>

      <LegalSection title="Changes">
        <p>
          We may update these Terms by posting a revised version. Your continued use after the
          effective date constitutes acceptance where permitted by law. If you do not agree, stop
          using the Service.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Questions:{" "}
          <a href={OPERATOR_WEBSITE} rel="noopener noreferrer">
            {OPERATOR_WEBSITE}
          </a>
          .
        </p>
      </LegalSection>
    </main>
  );
}
