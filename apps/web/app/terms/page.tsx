import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions — DataProfile",
  description: "Terms and conditions for using the DataProfile dataset profiling tool."
};

export default function TermsPage() {
  return (
    <main className="site-main legal-page">
      <h1>Terms &amp; Conditions</h1>
      <p>Last updated: May 31, 2026</p>

      <h2>Agreement</h2>
      <p>
        By accessing or using DataProfile (the &quot;Service&quot;), you agree to these Terms. If you do not
        agree, do not use the Service.
      </p>

      <h2>Service description</h2>
      <p>
        DataProfile profiles tabular datasets (CSV, Parquet, JSONL, and related formats), infers
        JSON Schema, detects drift between snapshots, and surfaces data-quality hints. Results are
        provided for informational purposes only and are not guaranteed to be complete or error-free.
      </p>

      <h2>Acceptable use</h2>
      <ul>
        <li>You must have the right to upload or reference any data you submit.</li>
        <li>
          You may not use the Service to process malware, unlawful content, or data you are not
          authorized to handle.
        </li>
        <li>
          You may not attempt to disrupt the Service, bypass rate or size limits, or access other
          users&apos; data.
        </li>
      </ul>

      <h2>No professional advice</h2>
      <p>
        Output from the Service does not constitute legal, compliance, security, or data-governance
        advice. You remain responsible for decisions made based on profiling results.
      </p>

      <h2>Availability and limits</h2>
      <p>
        The Service may impose file-size limits, rate limits, or maintenance windows. Features may
        change without notice. Self-hosted deployments are governed by the same license as the
        open-source repository (AGPL-3.0).
      </p>

      <h2>Intellectual property</h2>
      <p>
        The software is open source under AGPL-3.0. You retain ownership of your datasets. By
        submitting data, you grant the Service a limited, temporary license to process it solely to
        produce your requested results.
      </p>

      <h2>Disclaimer of warranties</h2>
      <p>
        THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot;, WITHOUT WARRANTIES OF ANY KIND,
        WHETHER EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
        NON-INFRINGEMENT.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL THE OPERATOR BE LIABLE
        FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF
        PROFITS, DATA, OR GOODWILL, ARISING FROM YOUR USE OF THE SERVICE, EVEN IF ADVISED OF THE
        POSSIBILITY OF SUCH DAMAGES. THE OPERATOR&apos;S TOTAL LIABILITY FOR ANY CLAIM SHALL NOT EXCEED
        ONE HUNDRED U.S. DOLLARS (US $100) OR THE AMOUNT YOU PAID TO USE THE SERVICE IN THE PAST
        TWELVE MONTHS, WHICHEVER IS GREATER.
      </p>

      <h2>Indemnification</h2>
      <p>
        You agree to indemnify and hold harmless the operator from claims arising out of your data,
        your misuse of the Service, or your violation of these Terms.
      </p>

      <h2>Governing law</h2>
      <p>
        These Terms are governed by the laws applicable where the operator resides, without regard to
        conflict-of-law rules. Disputes shall be resolved in the courts of that jurisdiction, unless
        mandatory consumer protection laws in your country require otherwise.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these Terms may be directed via{" "}
        <a href="https://www.chaitanyaprabuddha.com">chaitanyaprabuddha.com</a>.
      </p>
    </main>
  );
}
