"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { FavoriteButton } from "@/components/favorite-button";
import { HorizontalScroller } from "@/components/horizontal-scroller";
import type {
  CommunityLeaderboardCategory,
  CurrentFavorites,
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
  boards: Record<CommunityLeaderboardCategory, CommunityLeaderboardRow[]>;
  totals: Record<CommunityLeaderboardCategory, number>;
  agentRoles: Array<{ scopeKey: string; label: string; icon?: string }>;
  agentTotals: Record<string, number>;
  skinGroups: Array<{ scopeKey: string; label: string; total: number }>;
  initialFavorites: CurrentFavorites;
  participants: number;
  totalChoices: number;
}

const CATEGORY_LABELS: Record<CommunityLeaderboardCategory, string> = {
  agent: "Agents",
  map: "Maps",
  weapon: "Weapons",
  skin: "Skins",
};

export function CommunityLeaderboard({
  boards,
  totals,
  agentRoles,
  agentTotals,
  skinGroups,
  initialFavorites,
  participants,
  totalChoices,
}: CommunityLeaderboardProps) {
  const router = useRouter();
  const [category, setCategory] =
    useState<CommunityLeaderboardCategory>("agent");
  const [agentRole, setAgentRole] = useState(
    agentRoles[0]?.scopeKey ?? "controller",
  );
  const [skinGroup, setSkinGroup] = useState(
    skinGroups.find((group) => group.total > 0)?.scopeKey ??
      skinGroups[0]?.scopeKey ??
      "",
  );
  const [favorites, setFavorites] = useState(initialFavorites);
  const rows =
    category === "agent"
      ? boards.agent.filter((row) => row.scopeKey === agentRole).slice(0, 10)
      : category === "skin"
        ? boards.skin.filter((row) => row.scopeKey === skinGroup).slice(0, 10)
      : boards[category].slice(0, 10);
  const activeTotal =
    category === "agent"
      ? (agentTotals[agentRole] ?? 0)
      : category === "skin"
        ? (skinGroups.find((group) => group.scopeKey === skinGroup)?.total ?? 0)
        : totals[category];
  const activeRoleLabel =
    agentRoles.find((role) => role.scopeKey === agentRole)?.label ?? "Agent";
  const activeSkinGroup =
    skinGroups.find((group) => group.scopeKey === skinGroup)?.label ?? "Weapon";

  function updateFavorite(
    targetId: string | null,
    scopeKey: string,
    phase: "optimistic" | "confirmed" | "rollback",
  ) {
    setFavorites((current) => {
      if (category === "skin") {
        const skins = { ...current.skin };
        if (targetId) skins[scopeKey] = targetId;
        else delete skins[scopeKey];
        return { ...current, skin: skins };
      }

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
    <div className="mt-10">
      <p className="mb-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--muted)] sm:text-xs">
        <span>
          <span className="text-white">{participants}</span>{" "}
          {participants === 1 ? "participant" : "participants"}
        </span>
        <span aria-hidden="true" className="text-[var(--accent)]">
          /
        </span>
        <span>
          <span className="text-white">{totalChoices}</span> active{" "}
          {totalChoices === 1 ? "choice" : "choices"}
        </span>
      </p>

      <div
        className="grid grid-cols-4 border border-white/12"
        role="tablist"
        aria-label="Community favorite categories"
      >
        {(Object.keys(CATEGORY_LABELS) as CommunityLeaderboardCategory[]).map(
          (item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={category === item}
              onClick={() => setCategory(item)}
              className={`valorant-action min-h-14 border-r border-white/12 px-2 text-[10px] font-black uppercase tracking-[0.08em] last:border-r-0 sm:px-4 sm:text-xs sm:tracking-[0.12em] ${
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
          <div className="border-b border-white/10 px-2 pt-2">
            <HorizontalScroller
              ariaLabel="Choose agent role leaderboard"
              viewportRole="group"
              viewportClassName="flex"
            >
              {agentRoles.map((role) => (
                <button
                  key={role.scopeKey}
                  type="button"
                  aria-pressed={agentRole === role.scopeKey}
                  onClick={() => setAgentRole(role.scopeKey)}
                  className={`valorant-action min-h-12 min-w-[9.5rem] flex-1 border border-r-0 border-white/10 px-3 text-[11px] font-black uppercase tracking-[0.12em] last:border-r ${
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
            </HorizontalScroller>
          </div>
        ) : null}

        {category === "skin" ? (
          <div className="border-b border-white/10 px-4 py-4 sm:px-7">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--muted)]">
              Weapon collection
            </p>
            <HorizontalScroller
              ariaLabel="Choose weapon skin leaderboard"
              viewportRole="group"
              className="mt-3"
              viewportClassName="flex gap-2"
            >
              {skinGroups.map((group) => (
                <button
                  key={group.scopeKey}
                  type="button"
                  aria-pressed={skinGroup === group.scopeKey}
                  onClick={() => setSkinGroup(group.scopeKey)}
                  className={`valorant-action min-h-10 shrink-0 border px-4 text-[10px] font-black uppercase tracking-[0.12em] ${
                    skinGroup === group.scopeKey
                      ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                      : "border-white/12 text-[var(--muted)]"
                  }`}
                >
                  {group.label}
                  <span className="ml-2 font-mono opacity-65">
                    {group.total}
                  </span>
                </button>
              ))}
            </HorizontalScroller>
          </div>
        ) : null}

        <div className="flex flex-col gap-2 border-b border-white/10 px-4 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-7">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent)]">
              Community ranking
            </p>
            <h2 className="mt-1 font-display text-2xl font-black uppercase tracking-[-0.04em] sm:text-3xl">
              {category === "agent"
                ? `Favorite ${activeRoleLabel}`
                : category === "skin"
                  ? `Favorite ${activeSkinGroup} skin`
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
                className="group grid grid-cols-[2rem_4.25rem_minmax(0,1fr)_2.5rem] items-center gap-3 px-4 py-4 transition-colors hover:bg-white/[0.035] sm:grid-cols-[3rem_5rem_minmax(0,1fr)_6rem_auto] sm:gap-5 sm:px-7 sm:py-5"
              >
                <p className="font-display text-xl font-black text-white/30 sm:text-3xl">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <div className="relative h-14 w-[4.25rem] overflow-hidden bg-[#202832] sm:size-20">
                  <Image
                    src={row.image}
                    alt=""
                    fill
                    sizes="(min-width: 640px) 80px, 68px"
                    className="object-contain p-1.5 transition duration-300 group-hover:scale-[1.025]"
                  />
                </div>
                <div className="min-w-0">
                  {row.href ? (
                    <Link
                      href={row.href}
                      className="block truncate font-display text-base font-black uppercase tracking-[-0.025em] hover:text-[var(--accent)] focus-visible:outline-2 focus-visible:outline-[var(--accent)] sm:text-2xl"
                    >
                      {row.name}
                    </Link>
                  ) : (
                    <h3 className="truncate font-display text-base font-black uppercase tracking-[-0.025em] sm:text-2xl">
                      {row.name}
                    </h3>
                  )}
                  <span className="mt-0.5 flex items-center gap-1.5 truncate text-[9px] font-bold uppercase tracking-[0.1em] text-[var(--muted)] sm:mt-1 sm:gap-2 sm:text-xs sm:tracking-[0.12em]">
                    {row.metaIcon ? (
                      <Image
                        src={row.metaIcon}
                        alt=""
                        width={18}
                        height={18}
                        className="size-3.5 object-contain sm:size-[18px]"
                      />
                    ) : null}
                    <span className="truncate">{row.meta}</span>
                  </span>
                  <progress
                    value={row.percentage}
                    max={100}
                    aria-label={`${row.percentage}% of ${
                      category === "agent"
                        ? activeRoleLabel
                        : category === "skin"
                          ? activeSkinGroup
                          : category
                    } votes`}
                    className="community-progress mt-2 block h-1 w-full sm:mt-4 sm:h-1.5"
                  />
                  <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--muted)] sm:hidden">
                    {row.percentage}% · {row.votes}{" "}
                    {row.votes === 1 ? "vote" : "votes"}
                  </p>
                </div>
                <div className="hidden text-right sm:block">
                  <p className="font-display text-3xl font-black">
                    {row.percentage}%
                  </p>
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--muted)]">
                    {row.votes} {row.votes === 1 ? "vote" : "votes"}
                  </p>
                </div>
                <div className="flex justify-end">
                  <FavoriteButton
                    category={category}
                    scopeKey={row.scopeKey}
                    targetId={row.id}
                    targetName={row.name}
                    selected={
                      category === "agent"
                        ? favorites.agent[row.scopeKey] === row.id
                        : category === "skin"
                          ? favorites.skin[row.scopeKey] === row.id
                        : favorites[category] === row.id
                    }
                    selectedTargetId={
                      category === "agent"
                        ? (favorites.agent[row.scopeKey] ?? null)
                        : category === "skin"
                          ? (favorites.skin[row.scopeKey] ?? null)
                        : favorites[category]
                    }
                    onChange={updateFavorite}
                    appearance="responsive"
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
              {category === "agent"
                ? ` for ${activeRoleLabel}`
                : category === "skin"
                  ? ` for ${activeSkinGroup}`
                  : ""}{" "}
              yet.
              Choose yours from the catalog to set the first ranking.
            </p>
            <Link
              href={
                category === "map"
                  ? "/maps"
                  : category === "skin"
                    ? "/weapons"
                    : `/${category}s`
              }
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
