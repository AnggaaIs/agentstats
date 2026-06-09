"use client";

import { useMemo, useState } from "react";

import { CatalogCard } from "@/components/catalog-card";
import { ChoiceChip } from "@/components/choice-chip";
import { FavoriteButton } from "@/components/favorite-button";
import type { FavoriteCategoryName } from "@/lib/community";

export interface CatalogItem {
  id: string;
  href?: string;
  image: string;
  title: string;
  meta: string;
  group: string;
  variant?: "portrait" | "wide";
  imageFit?: "cover" | "contain";
  favoriteScope?: string;
}

interface CatalogBrowserProps {
  items: CatalogItem[];
  groups: string[];
  columns?: "three" | "four" | "two";
  perPage?: number;
  searchPlaceholder?: string;
  favoriteCategory?: FavoriteCategoryName;
  initialFavoriteIds?: Record<string, string>;
}

export function CatalogBrowser({
  items,
  groups,
  columns = "four",
  perPage = 12,
  searchPlaceholder = "Search collection",
  favoriteCategory,
  initialFavoriteIds = {},
}: CatalogBrowserProps) {
  const [activeGroups, setActiveGroups] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [favoriteIds, setFavoriteIds] = useState(initialFavoriteIds);
  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    return items.filter((item) => {
      const matchesGroup =
        activeGroups.length === 0 || activeGroups.includes(item.group);
      const matchesQuery =
        normalizedQuery.length === 0 ||
        `${item.title} ${item.meta} ${item.group}`
          .toLocaleLowerCase()
          .includes(normalizedQuery);

      return matchesGroup && matchesQuery;
    });
  }, [activeGroups, items, query]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(page, totalPages);
  const visible = filtered.slice((safePage - 1) * perPage, safePage * perPage);
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter(
    (item) =>
      item === 1 ||
      item === totalPages ||
      Math.abs(item - safePage) <= 2,
  );
  const gridClass =
    columns === "two"
      ? "md:grid-cols-2"
      : columns === "three"
        ? "sm:grid-cols-2 lg:grid-cols-3"
        : "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

  function toggleGroup(group: string) {
    setActiveGroups((current) =>
      current.includes(group)
        ? current.filter((item) => item !== group)
        : [...current, group],
    );
    setPage(1);
  }

  function updateFavorite(targetId: string | null, scopeKey: string) {
    setFavoriteIds((current) => {
      const next = { ...current };
      if (targetId) next[scopeKey] = targetId;
      else delete next[scopeKey];
      return next;
    });
  }

  return (
    <>
      <div className="motion-rise mt-12 grid gap-3 border-y border-white/8 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <label className="relative block">
          <span className="sr-only">{searchPlaceholder}</span>
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 fill-none stroke-[var(--muted)] stroke-2"
          >
            <circle cx="11" cy="11" r="6" />
            <path d="m16 16 4 4" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder={searchPlaceholder}
            className="min-h-12 w-full border border-white/12 bg-white/[0.035] pl-12 pr-4 text-sm font-bold text-white outline-none placeholder:text-[#65707e] focus:border-[var(--accent)]"
          />
        </label>
        <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--muted)]">
          {filtered.length} {filtered.length === 1 ? "result" : "results"}
        </p>
      </div>

      {groups.length > 1 ? (
        <fieldset className="border-b border-white/8 py-5">
          <legend className="sr-only">Choose categories</legend>
          <div className="flex flex-wrap gap-2">
            <ChoiceChip
              label="All"
              checked={activeGroups.length === 0}
              onChange={() => {
                setActiveGroups([]);
                setPage(1);
              }}
            />
            {groups.map((group) => (
              <ChoiceChip
                key={group}
                label={group}
                checked={activeGroups.includes(group)}
                onChange={() => toggleGroup(group)}
              />
            ))}
          </div>
        </fieldset>
      ) : null}

      {visible.length ? (
        <div className={`motion-stagger mt-10 grid gap-5 ${gridClass}`}>
          {visible.map((item) => (
            <div key={item.id} className="motion-card relative">
              <CatalogCard
                href={item.href}
                image={item.image}
                title={item.title}
                meta={item.meta}
                variant={item.variant}
                imageFit={item.imageFit}
                action={
                  favoriteCategory ? (
                    <FavoriteButton
                      category={favoriteCategory}
                      scopeKey={item.favoriteScope}
                      targetId={item.id}
                      targetName={item.title}
                      selected={
                        favoriteIds[item.favoriteScope ?? "default"] === item.id
                      }
                      onChange={updateFavorite}
                      appearance="compact"
                    />
                  ) : undefined
                }
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-10 border border-white/10 bg-[var(--panel)] px-6 py-12 text-center">
          <p className="font-display text-2xl font-black uppercase tracking-[-0.03em]">
            No matching items
          </p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Try another name or clear the selected categories.
          </p>
        </div>
      )}

      {totalPages > 1 ? (
        <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            disabled={safePage === 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="valorant-action min-h-11 border border-white/15 px-5 text-xs font-black uppercase tracking-widest disabled:cursor-not-allowed disabled:opacity-30"
          >
            Previous
          </button>
          {pages.map((item, index) => {
            const previous = pages[index - 1];

            return (
              <span key={item} className="contents">
                {previous && item - previous > 1 ? (
                  <span className="px-2 text-[var(--muted)]">···</span>
                ) : null}
              <button
                type="button"
                aria-current={item === safePage ? "page" : undefined}
                onClick={() => setPage(item)}
                className="valorant-action grid size-11 place-items-center border border-white/15 text-sm font-black"
              >
                {item}
              </button>
              </span>
            );
          })}
          <button
            type="button"
            disabled={safePage === totalPages}
            onClick={() =>
              setPage((current) => Math.min(totalPages, current + 1))
            }
            className="valorant-action min-h-11 border border-white/15 px-5 text-xs font-black uppercase tracking-widest disabled:cursor-not-allowed disabled:opacity-30"
          >
            Next
          </button>
        </div>
      ) : null}
    </>
  );
}
