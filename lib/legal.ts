export const LEGAL_EFFECTIVE_DATE = "June 13, 2026";
export const LEGAL_CONSENT_VERSION = "2026-06-13-v3";
export const PLAYER_DATA_CONSENT_VERSION = "2026-06-12-v2";
export const LEGAL_CONSENT_COOKIE = "agentstats_legal_consent";

export const LEGAL_EMAIL = process.env.NEXT_PUBLIC_LEGAL_EMAIL?.trim() || null;

export const LEGAL_LINKS = [
  { href: "/legal", label: "Legal overview" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/cookies", label: "Cookies" },
  { href: "/acceptable-use", label: "Acceptable use" },
  { href: "/disclaimer", label: "Disclaimer" },
  { href: "/data-requests", label: "Data requests" },
] as const;
