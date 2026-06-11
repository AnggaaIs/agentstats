import Image from "next/image";
import type { ReactNode } from "react";

import { AgentRoleLabel } from "@/components/agent-role-label";
import { RouteLink } from "@/components/route-link";

interface CatalogCardProps {
  href?: string;
  image: string;
  title: string;
  meta: string;
  metaIcon?: string;
  variant?: "portrait" | "wide";
  imageFit?: "cover" | "contain";
  action?: ReactNode;
}

export function CatalogCard({
  href,
  image,
  title,
  meta,
  metaIcon,
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
            ? "object-contain p-4 transition duration-300 group-hover:scale-[1.012] group-hover:saturate-105 sm:p-5"
            : "object-cover transition duration-300 group-hover:scale-[1.012] group-hover:saturate-105"
        }
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0f141a] via-transparent to-transparent transition group-hover:from-[#111820]" />
    </div>
  );
  const information = (
    <div className="relative -mt-7 grid min-h-20 grid-cols-[minmax(0,1fr)_auto] items-end gap-3 p-4 sm:-mt-8">
      <div className="responsive-text">
        <AgentRoleLabel
          name={meta}
          icon={metaIcon}
          className="responsive-text max-w-full text-[9px] font-black uppercase leading-4 tracking-[0.16em] text-[var(--accent)] sm:text-[10px] sm:tracking-[0.2em]"
          iconClassName="size-4"
        />
        <h2 className="responsive-text mt-1 font-display text-[clamp(1.1rem,5vw,1.35rem)] font-black uppercase leading-[1.05] tracking-[-0.04em]">
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
      <div className="relative -mt-7 grid min-h-20 grid-cols-[minmax(0,1fr)_auto] items-end gap-3 p-4 sm:-mt-8">
        <RouteLink
          href={href}
          className="responsive-text focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
        >
          <AgentRoleLabel
            name={meta}
            icon={metaIcon}
            className="responsive-text max-w-full text-[9px] font-black uppercase leading-4 tracking-[0.16em] text-[var(--accent)] sm:text-[10px] sm:tracking-[0.2em]"
            iconClassName="size-4"
          />
          <h2 className="responsive-text mt-1 font-display text-[clamp(1.1rem,5vw,1.35rem)] font-black uppercase leading-[1.05] tracking-[-0.04em]">
            {title}
          </h2>
        </RouteLink>
        {action ? <div className="relative z-10 shrink-0">{action}</div> : null}
      </div>
    </article>
  );
}
