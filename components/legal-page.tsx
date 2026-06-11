import type { ReactNode } from "react";

import { LegalNav } from "@/components/legal-nav";
import { LEGAL_EFFECTIVE_DATE } from "@/lib/legal";

interface LegalPageProps {
  title: string;
  description: string;
  children: ReactNode;
}

export function LegalPage({
  title,
  description,
  children,
}: LegalPageProps) {
  return (
    <div className="legal-layout mx-auto max-w-[86rem] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <aside className="legal-sidebar self-start">
        <div className="flex items-center gap-3">
          <span className="h-px w-8 bg-[var(--accent)]" aria-hidden="true" />
          <p className="text-[0.68rem] font-black uppercase tracking-[0.24em] text-white">
            Legal center
          </p>
        </div>
        <LegalNav />
      </aside>

      <article className="min-w-0 max-w-5xl">
        <header className="border-b border-white/10 pb-7">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.68rem] font-black uppercase tracking-[0.18em]">
            <span className="text-[var(--accent)]">AgentStats legal</span>
            <span className="h-px w-8 bg-white/20" aria-hidden="true" />
            <span className="text-[var(--muted)]">
              Effective {LEGAL_EFFECTIVE_DATE}
            </span>
          </div>
          <h1 className="mt-4 max-w-3xl font-display text-3xl font-black uppercase leading-[0.92] tracking-[-0.05em] text-[var(--paper)] sm:text-4xl lg:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--muted)] sm:text-base">
            {description}
          </p>
        </header>

        <div
          className="
            mt-2 max-w-3xl text-[0.96rem] leading-7 text-[var(--muted)]
            [&>h2]:mt-9 [&>h2]:border-t [&>h2]:border-white/10 [&>h2]:pt-6
            [&>h2]:font-display [&>h2]:text-2xl [&>h2]:font-black [&>h2]:uppercase
            [&>h2]:leading-tight [&>h2]:tracking-[-0.025em] [&>h2]:text-[var(--paper)]
            sm:[&>h2]:mt-11 sm:[&>h2]:pt-7 sm:[&>h2]:text-3xl
            [&>h3]:mt-7 [&>h3]:font-display [&>h3]:text-base [&>h3]:font-black
            [&>h3]:uppercase [&>h3]:tracking-[0.08em] [&>h3]:text-[var(--paper)]
            [&>p]:mt-4 [&>ul]:mt-5 [&>ul]:border-l-2 [&>ul]:border-[var(--accent)]
            [&>ul]:bg-white/[0.025] [&>ul]:px-5 [&>ul]:py-4 [&>ul]:text-[var(--paper)]
            [&>ul]:sm:px-6 [&>ul]:sm:py-5 [&>ul>li]:relative [&>ul>li]:pl-5
            [&>ul>li]:before:absolute [&>ul>li]:before:left-0 [&>ul>li]:before:top-[0.7rem]
            [&>ul>li]:before:h-1 [&>ul>li]:before:w-1 [&>ul>li]:before:bg-[var(--accent)]
            [&>ul>li+li]:mt-3 [&_a]:font-bold [&_a]:text-[var(--paper)]
            [&_a]:underline [&_a]:decoration-[var(--accent)] [&_a]:underline-offset-4
          "
        >
          {children}
        </div>
      </article>
    </div>
  );
}
