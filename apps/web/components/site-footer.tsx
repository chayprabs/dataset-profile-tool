import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <Link href="/privacy">Privacy Policy</Link>
      <span aria-hidden className="site-footer-sep">
        ·
      </span>
      <Link href="/terms">Terms &amp; Conditions</Link>
    </footer>
  );
}
