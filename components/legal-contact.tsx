import { LEGAL_EMAIL } from "@/lib/legal";

export function LegalContact() {
  if (!LEGAL_EMAIL) {
    return (
      <div className="my-7 border-l-2 border-amber-300 bg-amber-300/5 px-5 py-4 text-sm leading-6 text-amber-100">
        <p className="font-black uppercase tracking-[0.08em]">Contact pending</p>
        <p className="mt-1">
          This deployment has not configured a public legal contact address.
          The operator must set one before public launch.
        </p>
      </div>
    );
  }

  return (
    <div className="my-7 border-l-2 border-[var(--accent)] bg-[var(--panel)] px-5 py-4">
      <a
        href={`mailto:${LEGAL_EMAIL}`}
        className="font-bold text-white underline decoration-[var(--accent)] underline-offset-4"
      >
        {LEGAL_EMAIL}
      </a>
    </div>
  );
}
