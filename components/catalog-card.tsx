import Image from "next/image";
import type { ReactNode } from "react";

import { RouteLink } from "@/components/route-link";

interface CatalogCardProps {
  href?: string;
  image: string;
  title: string;
  meta: string;
  variant?: "portrait" | "wide";
  imageFit?: "cover" | "contain";
  action?: ReactNode;
}

export function CatalogCard({
  href,
  image,
  title,
  meta,
  variant = "portrait",
  imageFit = "cover",
  action,
}: CatalogCardProps) {
  const artwork = (
    <div
      className={
        variant === "wide"
          ? "relative aspect-[16/10] overflow-hidden bg-[#202832]"
          : "relative aspect-[4/5] overflow-hidden bg-[#202832]"
      }
    >
      <Image
        src={image}
        alt={`${title} artwork`}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        className={
          imageFit === "contain"
            ? "object-contain p-6 transition duration-300 group-hover:scale-[1.012] group-hover:saturate-105 sm:p-8"
            : "object-cover transition duration-300 group-hover:scale-[1.012] group-hover:saturate-105"
        }
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0f141a] via-transparent to-transparent transition group-hover:from-[#111820]" />
    </div>
  );
  const information = (
    <div className="relative -mt-10 flex min-h-24 items-end justify-between gap-4 p-5">
      <div className="min-w-0">
        <p className="truncate text-[10px] font-black uppercase tracking-[0.22em] text-[var(--accent)]">
          {meta}
        </p>
        <h2 className="mt-1 truncate font-display text-2xl font-black uppercase tracking-[-0.04em]">
          {title}
        </h2>
      </div>
      {action ? <div className="relative z-10 shrink-0">{action}</div> : null}
    </div>
  );

  if (!href) {
    return (
      <article className="group valorant-panel">
        {artwork}
        {information}
      </article>
    );
  }

  return (
    <article className="group valorant-panel">
      <RouteLink
        href={href}
        aria-label={`View ${title}`}
        className="block focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--accent)]"
      >
        {artwork}
      </RouteLink>
      <div className="relative -mt-10 flex min-h-24 items-end justify-between gap-4 p-5">
        <RouteLink
          href={href}
          className="min-w-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
        >
          <p className="truncate text-[10px] font-black uppercase tracking-[0.22em] text-[var(--accent)]">
            {meta}
          </p>
          <h2 className="mt-1 truncate font-display text-2xl font-black uppercase tracking-[-0.04em]">
            {title}
          </h2>
        </RouteLink>
        {action ? <div className="relative z-10 shrink-0">{action}</div> : null}
      </div>
    </article>
  );
}
