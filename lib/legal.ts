export const LEGAL_EFFECTIVE_DATE = "June 9, 2026";

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
