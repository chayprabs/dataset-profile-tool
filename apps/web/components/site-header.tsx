import Link from "next/link";

import { GitHubIcon, GlobeIcon, XIcon } from "./icons";

const githubUrl = "https://github.com/chayprabs/dataset-profile-tool";
const twitterUrl = "https://x.com/chayprabs";
const websiteUrl = "https://www.chaitanyaprabuddha.com";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="site-brand" href="/">
        DataProfile
      </Link>
      <nav aria-label="External links" className="site-header-links">
        <a
          className="site-icon-link"
          href={githubUrl}
          rel="noopener noreferrer"
          target="_blank"
          title="GitHub repository"
        >
          <GitHubIcon className="h-5 w-5" />
          <span className="sr-only">GitHub</span>
        </a>
        <a
          className="site-icon-link"
          href={twitterUrl}
          rel="noopener noreferrer"
          target="_blank"
          title="Twitter / X"
        >
          <XIcon className="h-5 w-5" />
          <span className="sr-only">Twitter</span>
        </a>
        <a
          className="site-icon-link"
          href={websiteUrl}
          rel="noopener noreferrer"
          target="_blank"
          title="Personal website"
        >
          <GlobeIcon className="h-5 w-5" />
          <span className="sr-only">Website</span>
        </a>
      </nav>
    </header>
  );
}
