import Image from "next/image";

import { RouteLink } from "@/components/route-link";

interface CatalogCardProps {
  href?: string;
  image: string;
  title: string;
  meta: string;
  variant?: "portrait" | "wide";
  imageFit?: "cover" | "contain";
}

export function CatalogCard({
  href,
  image,
  title,
  meta,
  variant = "portrait",
  imageFit = "cover",
}: CatalogCardProps) {
  const content = (
    <>
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
              ? "object-contain p-6 transition duration-300 group-hover:scale-[1.025] group-hover:saturate-110 sm:p-8"
              : "object-cover transition duration-300 group-hover:scale-[1.025] group-hover:saturate-110"
          }
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f141a] via-transparent to-transparent transition group-hover:from-[#111820]" />
      </div>
      <div className="relative -mt-10 p-5">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--accent)]">
          {meta}
        </p>
        <h2 className="mt-1 font-display text-2xl font-black uppercase tracking-[-0.04em]">
          {title}
        </h2>
      </div>
    </>
  );

  if (!href) {
    return <article className="group valorant-panel">{content}</article>;
  }

  return (
    <RouteLink
      href={href}
      className="group valorant-panel focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
    >
      {content}
    </RouteLink>
  );
}
