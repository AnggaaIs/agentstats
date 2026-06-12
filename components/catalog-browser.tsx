"use client";

import { useMemo, useState } from "react";

import { CatalogCard } from "@/components/catalog-card";
import { ChoiceChip } from "@/components/choice-chip";
import { FavoriteButton } from "@/components/favorite-button";
import type {
  CommunityCount,
  FavoriteCategoryName,
} from "@/lib/community";

export interface CatalogItem {
  id: string;
  href?: string;
  image: string;
  title: string;
  meta: string;
  metaIcon?: string;
  group: string;
  variant?: "portrait" | "wide";
  imageFit?: "cover" | "contain";
  favoriteScope?: string;
}

interface CatalogBrowserProps {
  items: CatalogItem[];
  groups: string[];
  groupIcons?: Record<string, string>;
  columns?: "three" | "four" | "two";
  paginate?: boolean;
  perPage?: number;
  searchPlaceholder?: string;
  favoriteCategory?: FavoriteCategoryName;
  initialFavoriteIds?: Record<string, string>;
  initialFavoriteCounts?: CommunityCount[];
}

export function CatalogBrowser({
  items,
  groups,
  groupIcons = {},
  columns = "four",
  paginate = true,
  perPage = 12,
  searchPlaceholder = "Search collection",
  favoriteCategory,
  initialFavoriteIds = {},
  initialFavoriteCounts = [],
}: CatalogBrowserProps) {
  const [activeGroups, setActiveGroups] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [favoriteIds, setFavoriteIds] = useState(initialFavoriteIds);
  const [favoriteCounts, setFavoriteCounts] = useState<Record<string, number>>(
    Object.fromEntries(
      initialFavoriteCounts.map((count) => [count.targetId, count.votes]),
    ),
  );
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
  const totalPages = paginate
    ? Math.max(1, Math.ceil(filtered.length / perPage))
    : 1;
  const safePage = Math.min(page, totalPages);
  const visible = paginate
    ? filtered.slice((safePage - 1) * perPage, safePage * perPage)
    : filtered;
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter(
    (item) =>
      item === 1 ||
      item === totalPages ||
      Math.abs(item - safePage) <= 2,
  );
  const gridClass =
    columns === "two"
      ? "md:grid-cols-2 xl:grid-cols-3"
      : columns === "three"
        ? "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        : "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5";

  function toggleGroup(group: string) {
    setActiveGroups((current) =>
      current.includes(group)
        ? current.filter((item) => item !== group)
        : [...current, group],
    );
    setPage(1);
  }

  function updateFavorite(
    targetId: string | null,
    scopeKey: string,
    phase: "optimistic" | "confirmed" | "rollback",
    counts?: CommunityCount[],
  ) {
    setFavoriteIds((current) => {
      const previousTargetId = current[scopeKey] ?? null;
      if (phase === "confirmed" && counts) {
        setFavoriteCounts(
          Object.fromEntries(
            counts.map((count) => [count.targetId, count.votes]),
          ),
        );
      } else if (previousTargetId !== targetId) {
        setFavoriteCounts((currentCounts) => {
          const nextCounts = { ...currentCounts };
          if (previousTargetId) {
            nextCounts[previousTargetId] = Math.max(
              0,
              (nextCounts[previousTargetId] ?? 0) - 1,
            );
          }
          if (targetId) {
            nextCounts[targetId] = (nextCounts[targetId] ?? 0) + 1;
          }
          return nextCounts;
        });
      }
      const next = { ...current };
      if (targetId) next[scopeKey] = targetId;
      else delete next[scopeKey];
      return next;
    });
  }

  return (
    <>
      <div className="motion-rise mt-8 grid gap-3 border-y border-white/8 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <label className="relative block min-w-0">
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
            className="min-h-11 w-full border border-white/12 bg-white/[0.035] pl-12 pr-4 text-sm font-bold text-white outline-none placeholder:text-[#65707e] focus:border-[var(--accent)]"
          />
        </label>
        <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--muted)]">
          {filtered.length} {filtered.length === 1 ? "result" : "results"}
        </p>
      </div>

      {groups.length > 1 ? (
        <fieldset className="border-b border-white/8 py-3.5">
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
                icon={groupIcons[group]}
                checked={activeGroups.includes(group)}
                onChange={() => toggleGroup(group)}
              />
            ))}
          </div>
        </fieldset>
      ) : null}

      {visible.length ? (
        <div className={`motion-stagger mt-7 grid min-w-0 gap-4 ${gridClass}`}>
          {visible.map((item) => (
            <div key={item.id} className="motion-card relative h-full min-w-0">
              <CatalogCard
                href={item.href}
                image={item.image}
                title={item.title}
                meta={item.meta}
                metaIcon={item.metaIcon}
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
                      selectedTargetId={
                        favoriteIds[item.favoriteScope ?? "default"] ?? null
                      }
                      voteCount={favoriteCounts[item.id] ?? 0}
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
        <div className="mt-6 border border-white/10 bg-[var(--panel)] px-5 py-8 text-center">
          <p className="font-display text-2xl font-black uppercase tracking-[-0.03em]">
            No matching items
          </p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Try another name or clear the selected categories.
          </p>
        </div>
      )}

      {paginate && totalPages > 1 ? (
        <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            disabled={safePage === 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="valorant-action min-h-10 border border-white/15 px-4 text-[11px] font-black uppercase tracking-widest disabled:cursor-not-allowed disabled:opacity-30"
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
                className="valorant-action grid size-10 place-items-center border border-white/15 text-xs font-black"
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
            className="valorant-action min-h-10 border border-white/15 px-4 text-[11px] font-black uppercase tracking-widest disabled:cursor-not-allowed disabled:opacity-30"
          >
            Next
          </button>
        </div>
      ) : null}
    </>
  );
}
