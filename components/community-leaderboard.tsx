"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { FavoriteButton } from "@/components/favorite-button";
import type {
  CurrentFavorites,
  FavoriteCategoryName,
} from "@/lib/community";

export interface CommunityLeaderboardRow {
  id: string;
  name: string;
  image: string;
  meta: string;
  metaIcon?: string;
  scopeKey: string;
  votes: number;
  percentage: number;
  href?: string;
}

interface CommunityLeaderboardProps {
  boards: Record<FavoriteCategoryName, CommunityLeaderboardRow[]>;
  totals: Record<FavoriteCategoryName, number>;
  agentRoles: Array<{ scopeKey: string; label: string; icon?: string }>;
  agentTotals: Record<string, number>;
  initialFavorites: CurrentFavorites;
}

const CATEGORY_LABELS: Record<FavoriteCategoryName, string> = {
  agent: "Agents",
  map: "Maps",
  weapon: "Weapons",
};

export function CommunityLeaderboard({
  boards,
  totals,
  agentRoles,
  agentTotals,
  initialFavorites,
}: CommunityLeaderboardProps) {
  const router = useRouter();
  const [category, setCategory] = useState<FavoriteCategoryName>("agent");
  const [agentRole, setAgentRole] = useState(
    agentRoles[0]?.scopeKey ?? "controller",
  );
  const [favorites, setFavorites] = useState(initialFavorites);
  const rows =
    category === "agent"
      ? boards.agent.filter((row) => row.scopeKey === agentRole).slice(0, 10)
      : boards[category].slice(0, 10);
  const activeTotal =
    category === "agent" ? (agentTotals[agentRole] ?? 0) : totals[category];
  const activeRoleLabel =
    agentRoles.find((role) => role.scopeKey === agentRole)?.label ?? "Agent";

  function updateFavorite(
    targetId: string | null,
    scopeKey: string,
    phase: "optimistic" | "confirmed" | "rollback",
  ) {
    setFavorites((current) => {
      if (category !== "agent") {
        return { ...current, [category]: targetId };
      }

      const agents = { ...current.agent };
      if (targetId) agents[scopeKey] = targetId;
      else delete agents[scopeKey];
      return { ...current, agent: agents };
    });
    if (phase === "confirmed") router.refresh();
  }

  return (
    <div className="mt-12">
      <div
        className="grid grid-cols-3 border border-white/12"
        role="tablist"
        aria-label="Community favorite categories"
      >
        {(Object.keys(CATEGORY_LABELS) as FavoriteCategoryName[]).map(
          (item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={category === item}
              onClick={() => setCategory(item)}
              className={`valorant-action min-h-14 border-r border-white/12 px-3 text-xs font-black uppercase tracking-[0.12em] last:border-r-0 ${
                category === item
                  ? "bg-[var(--accent)] text-white"
                  : "text-[var(--muted)]"
              }`}
            >
              {CATEGORY_LABELS[item]}
            </button>
          ),
        )}
      </div>

      <section
        role="tabpanel"
        className="border-x border-b border-white/12 bg-[#10161d]"
      >
        {category === "agent" ? (
          <div
            className="grid grid-cols-2 border-b border-white/10 sm:grid-cols-4"
            role="group"
            aria-label="Choose agent role leaderboard"
          >
            {agentRoles.map((role) => (
              <button
                key={role.scopeKey}
                type="button"
                aria-pressed={agentRole === role.scopeKey}
                onClick={() => setAgentRole(role.scopeKey)}
                className={`valorant-action min-h-12 border-b border-r border-white/10 px-3 text-[11px] font-black uppercase tracking-[0.12em] sm:border-b-0 ${
                  agentRole === role.scopeKey
                    ? "bg-white/[0.07] text-white outline outline-1 -outline-offset-1 outline-[var(--accent)]"
                    : "text-[var(--muted)]"
                }`}
              >
                {role.label}
                {role.icon ? (
                  <Image
                    src={role.icon}
                    alt=""
                    width={18}
                    height={18}
                    className="ml-2 inline-block size-[18px] object-contain align-middle"
                  />
                ) : null}
                <span className="ml-2 font-mono text-[10px] opacity-60">
                  {agentTotals[role.scopeKey] ?? 0}
                </span>
              </button>
            ))}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-7">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent)]">
              Community ranking
            </p>
            <h2 className="mt-1 font-display text-3xl font-black uppercase tracking-[-0.04em]">
              {category === "agent"
                ? `Favorite ${activeRoleLabel}`
                : `Favorite ${CATEGORY_LABELS[category]}`}
            </h2>
          </div>
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
            {activeTotal} verified {activeTotal === 1 ? "vote" : "votes"}
          </p>
        </div>

        {rows.length ? (
          <ol className="divide-y divide-white/8">
            {rows.map((row, index) => (
              <li
                key={row.id}
                className="group grid gap-5 px-5 py-5 transition-colors hover:bg-white/[0.035] sm:grid-cols-[3rem_5rem_minmax(0,1fr)_auto] sm:items-center sm:px-7"
              >
                <p className="font-display text-3xl font-black text-white/25">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <div className="relative aspect-square overflow-hidden bg-[#202832]">
                  <Image
                    src={row.image}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-contain p-1 transition duration-300 group-hover:scale-[1.025]"
                  />
                </div>
                <div className="min-w-0">
                  {row.href ? (
                    <Link
                      href={row.href}
                      className="font-display text-2xl font-black uppercase tracking-[-0.03em] hover:text-[var(--accent)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
                    >
                      {row.name}
                    </Link>
                  ) : (
                    <h3 className="font-display text-2xl font-black uppercase tracking-[-0.03em]">
                      {row.name}
                    </h3>
                  )}
                  <span className="mt-1 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
                    {row.metaIcon ? (
                      <Image
                        src={row.metaIcon}
                        alt=""
                        width={18}
                        height={18}
                        className="size-[18px] object-contain"
                      />
                    ) : null}
                    {row.meta}
                  </span>
                  <progress
                    value={row.percentage}
                    max={100}
                    aria-label={`${row.percentage}% of ${
                      category === "agent" ? activeRoleLabel : category
                    } votes`}
                    className="community-progress mt-4 block h-1.5 w-full"
                  />
                </div>
                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <div className="text-right">
                    <p className="font-display text-3xl font-black">
                      {row.percentage}%
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--muted)]">
                      {row.votes} {row.votes === 1 ? "vote" : "votes"}
                    </p>
                  </div>
                  <FavoriteButton
                    category={category}
                    scopeKey={row.scopeKey}
                    targetId={row.id}
                    targetName={row.name}
                    selected={
                      category === "agent"
                        ? favorites.agent[row.scopeKey] === row.id
                        : favorites[category] === row.id
                    }
                    selectedTargetId={
                      category === "agent"
                        ? (favorites.agent[row.scopeKey] ?? null)
                        : favorites[category]
                    }
                    onChange={updateFavorite}
                  />
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <div className="px-6 py-16 text-center">
            <p className="font-display text-3xl font-black uppercase tracking-[-0.04em]">
              The board is waiting
            </p>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-[var(--muted)]">
              No verified favorite has been recorded
              {category === "agent" ? ` for ${activeRoleLabel}` : ""} yet.
              Choose yours from the catalog to set the first ranking.
            </p>
            <Link
              href={`/${category === "map" ? "maps" : `${category}s`}`}
              className="valorant-action mt-7 inline-flex min-h-12 items-center border border-[var(--accent)] px-6 text-xs font-black uppercase tracking-[0.14em]"
            >
              Browse {CATEGORY_LABELS[category]}
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
