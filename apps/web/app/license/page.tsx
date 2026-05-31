import type { Metadata } from "next";
import { LegalSection } from "../../components/legal-section";
import {
  LEGAL_LAST_UPDATED,
  OPERATOR_GITHUB,
  OPERATOR_NAME,
  OPERATOR_WEBSITE,
  PRODUCT_NAME,
  SOFTWARE_LICENSE
} from "../../lib/legal/operator";

export const metadata: Metadata = {
  title: "License — DataProfile",
  description: "Software license and legal notices for DataProfile."
};

export default function LicensePage() {
  return (
    <main className="site-main legal-page">
      <h1>License &amp; Legal Notices</h1>
      <p>Last updated: {LEGAL_LAST_UPDATED}</p>

      <LegalSection title="Software license">
        <p>
          The {PRODUCT_NAME} source code in the{" "}
          <a href={OPERATOR_GITHUB} rel="noopener noreferrer">
            public repository
          </a>{" "}
          is copyright {OPERATOR_NAME} and licensed under the{" "}
          <strong>{SOFTWARE_LICENSE}</strong>.
        </p>
        <p>
          You may copy, modify, and redistribute the software under the terms of the AGPL-3.0,
          including the obligation to offer corresponding source when you run a modified version as
          a network service. The full license text is in the repository{" "}
          <a href={`${OPERATOR_GITHUB}/blob/main/LICENSE`}>LICENSE</a> file. A short copyright notice
          is also in <code>NOTICE</code>.
        </p>
      </LegalSection>

      <LegalSection title="Hosted service">
        <p>
          Using the Operator&apos;s <strong>hosted website or API</strong> is not the same as
          merely receiving a copy of the software. Hosted use is also subject to:
        </p>
        <ul>
          <li>
            <a href="/terms">Terms &amp; Conditions</a> (disclaimers, liability limits, acceptable
            use, indemnification where permitted);
          </li>
          <li>
            <a href="/privacy">Privacy Policy</a> (how uploads and logs are handled).
          </li>
        </ul>
        <p>
          Self-hosting on your own infrastructure: you are responsible for compliance with your
          policies and applicable law; adopt or adapt these documents if helpful.
        </p>
      </LegalSection>

      <LegalSection title="No warranty">
        <p>
          THE SOFTWARE IS PROVIDED &quot;AS IS&quot;, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
          IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
          PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
          BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT
          OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
          DEALINGS IN THE SOFTWARE, EXCEPT AS REQUIRED BY APPLICABLE LAW.
        </p>
        <p>
          (This paragraph summarizes the AGPL&apos;s warranty disclaimer; the LICENSE file controls
          in case of conflict.)
        </p>
      </LegalSection>

      <LegalSection title="Trademarks">
        <p>
          &quot;{PRODUCT_NAME}&quot; and related branding refer to this project. Third-party names
          and formats (for example DuckDB, Parquet) are property of their respective owners.
        </p>
      </LegalSection>

      <LegalSection title="Contributions">
        <p>
          By submitting a pull request or patch to the repository, you represent that you have the
          right to contribute that material and you license your contribution under the same{" "}
          {SOFTWARE_LICENSE} as the project, so it can be merged and distributed with the rest of the
          codebase.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          {OPERATOR_NAME} —{" "}
          <a href={OPERATOR_WEBSITE} rel="noopener noreferrer">
            {OPERATOR_WEBSITE}
          </a>
        </p>
      </LegalSection>
    </main>
  );
}
