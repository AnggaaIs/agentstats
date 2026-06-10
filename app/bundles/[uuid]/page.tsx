import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/json-ld";
import { RouteLink } from "@/components/route-link";
import { breadcrumbJsonLd, createMetadata } from "@/lib/seo";
import { getBundle } from "@/lib/valorant-api";

interface BundlePageProps {
  params: Promise<{ uuid: string }>;
}

export async function generateMetadata({
  params,
}: BundlePageProps): Promise<Metadata> {
  try {
    const { uuid } = await params;
    const bundle = await getBundle(uuid);
    return createMetadata({
      title: `${bundle.displayName} Valorant Bundle`,
      description:
        bundle.promoDescription ||
        bundle.description ||
        `Explore the ${bundle.displayName} Valorant store bundle, promotional artwork, collection details, and archive entry.`,
      path: `/bundles/${uuid}`,
      image: bundle.displayIcon2 || bundle.displayIcon,
      imageAlt: `${bundle.displayName} Valorant bundle`,
    });
  } catch {
    return createMetadata({
      title: "Bundle not found",
      path: "/bundles",
      noIndex: true,
    });
  }
}

export default async function BundlePage({ params }: BundlePageProps) {
  const bundle = await getBundle((await params).uuid).catch(() => null);
  if (!bundle) notFound();

  const descriptions = [
    bundle.displayNameSubText,
    bundle.description,
    bundle.extraDescription,
    bundle.promoDescription,
  ].filter(
    (value, index, values): value is string =>
      Boolean(value?.trim()) && values.indexOf(value) === index,
  );

  return (
    <article>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Valorant Bundles", path: "/bundles" },
          { name: bundle.displayName, path: `/bundles/${bundle.uuid}` },
        ])}
      />
      <header className="relative isolate min-h-[34rem] overflow-hidden border-b border-white/8">
        <Image
          src={bundle.displayIcon2 || bundle.displayIcon}
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover opacity-45"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0b1016] via-[#0b1016]/90 to-[#0b1016]/35" />
        <div className="mx-auto flex min-h-[34rem] max-w-7xl items-end px-5 py-14 lg:px-8 lg:py-20">
          <div className="min-w-0 max-w-4xl">
            <RouteLink
              href="/bundles"
              className="text-xs font-black uppercase tracking-[0.16em] text-[var(--muted)] transition hover:text-white"
            >
              Back to bundle archive
            </RouteLink>
            <p className="eyebrow mt-8">Store collection</p>
            <h1 className="responsive-text mt-5 font-display text-[clamp(3.2rem,15vw,7.5rem)] font-black uppercase leading-[0.82] tracking-[-0.07em]">
              {bundle.displayName}
            </h1>
            {bundle.displayNameSubText ? (
              <p className="mt-5 text-lg font-bold uppercase tracking-[0.12em] text-white/75">
                {bundle.displayNameSubText}
              </p>
            ) : null}
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-14 lg:grid-cols-[0.65fr_1.35fr] lg:px-8 lg:py-20">
        <div className="relative aspect-[4/5] min-w-0 overflow-hidden border border-white/10 bg-[var(--panel)]">
          <Image
            src={bundle.verticalPromoImage || bundle.displayIcon}
            alt={`${bundle.displayName} promotional artwork`}
            fill
            sizes="(max-width: 1024px) 100vw, 35vw"
            className="object-cover"
          />
        </div>
        <div className="min-w-0 self-center">
          <p className="eyebrow">Archive notes</p>
          <h2 className="responsive-text mt-5 font-display text-4xl font-black uppercase tracking-[-0.045em] sm:text-6xl">
            Collection record
          </h2>
          {descriptions.length ? (
            <div className="mt-8 grid gap-4">
              {descriptions.map((description) => (
                <p
                  key={description}
                  className="responsive-text border-l-2 border-[var(--accent)] pl-5 text-base leading-8 text-[var(--muted)]"
                >
                  {description}
                </p>
              ))}
            </div>
          ) : (
            <p className="mt-8 text-base leading-8 text-[var(--muted)]">
              No additional promotional copy is present in the public game
              content for this bundle.
            </p>
          )}
          <p className="mt-8 font-mono text-[10px] uppercase leading-5 tracking-[0.14em] text-white/40">
            Archive ID / {bundle.uuid}
          </p>
        </div>
      </section>
    </article>
  );
}
