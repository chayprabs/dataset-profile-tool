import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — DataProfile",
  description: "Privacy policy for the DataProfile online dataset profiling tool."
};

export default function PrivacyPage() {
  return (
    <main className="site-main legal-page">
      <h1>Privacy Policy</h1>
      <p>Last updated: May 31, 2026</p>

      <h2>Overview</h2>
      <p>
        DataProfile (&quot;we&quot;, &quot;the tool&quot;) is an open-source dataset profiling service operated by
        Chaitanya Prabuddha. This policy explains what happens when you upload files or paste URLs
        to generate profiles, schemas, or drift reports.
      </p>

      <h2>Data we process</h2>
      <ul>
        <li>
          Files you upload, URLs you submit, and derived statistics (column types, aggregates,
          sample rows, inferred JSON Schema, drift classifications).
        </li>
        <li>
          Ephemeral share tokens if you create a share link (read-only snapshot stored for a
          limited TTL, then deleted).
        </li>
        <li>
          Standard web server logs (IP address, user agent, request timestamps) when you access
          the hosted site.
        </li>
      </ul>

      <h2>How we use data</h2>
      <p>
        Your datasets are processed only to produce the results you request. We do not sell
        personal information, use uploaded content for advertising, or train third-party models on
        your files.
      </p>

      <h2>Retention</h2>
      <p>
        Uploads and job artifacts are kept in ephemeral storage for a short TTL (typically minutes,
        configurable on self-hosted deployments) and are automatically removed afterward. Share
        links expire when their TTL elapses.
      </p>

      <h2>PII and sensitive data</h2>
      <p>
        The tool may flag columns that resemble email addresses, phone numbers, or other sensitive
        patterns. You are responsible for not uploading regulated data unless you have a lawful basis
        to do so. Use self-hosting if your policy requires data to remain inside your network.
      </p>

      <h2>Third parties</h2>
      <p>
        Hosted deployments may rely on infrastructure providers (for example cloud compute,
        object storage, or CDN). Those providers process data only as needed to run the service.
        The application code is AGPL-3.0 licensed and does not include third-party advertising or
        analytics trackers.
      </p>

      <h2>Your choices</h2>
      <ul>
        <li>Do not use the public hosted instance for confidential datasets; self-host instead.</li>
        <li>Do not create share links for sensitive reports unless recipients are authorized.</li>
        <li>Contact the operator via the website linked in the header for privacy questions.</li>
      </ul>

      <h2>Disclaimer</h2>
      <p>
        This tool is provided &quot;as is&quot; without warranties. To the fullest extent permitted by law,
        the operator is not liable for indirect, incidental, or consequential damages arising from
        use of the service.
      </p>

      <h2>Changes</h2>
      <p>
        We may update this policy. Continued use after changes are posted constitutes acceptance of
        the revised policy.
      </p>
    </main>
  );
}
