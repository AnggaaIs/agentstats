import type { Metadata } from "next";

import { CatalogBrowser } from "@/components/catalog-browser";
import { PageHeading } from "@/components/page-heading";
import { createMetadata } from "@/lib/seo";
import { getBundles } from "@/lib/valorant-api";

export const metadata: Metadata = createMetadata({
  title: "Valorant Bundle Archive",
  description:
    "Browse the Valorant store bundle archive, historical collection names, banners, promotional artwork, and release entries.",
  path: "/bundles",
});

export default async function BundlesPage() {
  const bundles = await getBundles();

  return (
    <section className="mx-auto max-w-[86rem] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <PageHeading
        eyebrow={`${bundles.length} archive entries`}
        title="Bundle archive"
        description="Browse historical Valorant store collections. Repeated names can represent separate releases or platform entries in the game files."
      />
      <CatalogBrowser
        items={bundles.map((bundle) => ({
          id: bundle.uuid,
          href: `/bundles/${bundle.uuid}`,
          image: bundle.displayIcon,
          title: bundle.displayName,
          meta:
            bundle.displayNameSubText ||
            bundle.promoDescription ||
            "Store collection",
          group: "Bundle",
          variant: "wide" as const,
          imageFit: "cover" as const,
        }))}
        groups={[]}
        columns="three"
        perPage={12}
        searchPlaceholder="Search bundle archive"
      />
    </section>
  );
}
