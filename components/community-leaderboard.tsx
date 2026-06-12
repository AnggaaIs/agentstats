"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { FavoriteButton } from "@/components/favorite-button";
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
    <div className="mt-7">
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
        className="grid max-w-2xl grid-cols-4 border border-white/12"
        role="group"
        aria-label="Community favorite categories"
      >
        {(Object.keys(CATEGORY_LABELS) as CommunityLeaderboardCategory[]).map(
          (item) => (
            <button
              key={item}
              type="button"
              aria-pressed={category === item}
              onClick={() => setCategory(item)}
              className={`valorant-action min-h-10 border-r border-white/12 px-2 text-[10px] font-black uppercase tracking-[0.08em] last:border-r-0 sm:px-4 sm:text-[11px] sm:tracking-[0.11em] ${
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
        aria-live="polite"
        className="border-x border-b border-white/12 bg-[#10161d]"
      >
        {category === "agent" ? (
          <div className="border-b border-white/10 px-3 py-3">
            <div
              role="group"
              aria-label="Choose agent role leaderboard"
              className="flex flex-wrap gap-2"
            >
              {agentRoles.map((role) => (
                <button
                  key={role.scopeKey}
                  type="button"
                  aria-pressed={agentRole === role.scopeKey}
                  onClick={() => setAgentRole(role.scopeKey)}
                  className={`valorant-action min-h-10 min-w-0 border border-white/10 px-3 text-[10px] font-black uppercase tracking-[0.08em] sm:text-[11px] sm:tracking-[0.1em] ${
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
          </div>
        ) : null}

        {category === "skin" ? (
          <div className="border-b border-white/10 px-4 py-3 sm:px-5">
            <label className="block max-w-md">
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--muted)]">
                Weapon collection
              </span>
              <span className="relative mt-2 block">
                <select
                  value={skinGroup}
                  onChange={(event) => setSkinGroup(event.target.value)}
                  className="min-h-11 w-full appearance-none border border-white/12 bg-[#10161d] px-4 pr-10 text-[11px] font-black uppercase tracking-[0.1em] outline-none focus:border-[var(--accent)]"
                >
                  {skinGroups.map((group) => (
                    <option key={group.scopeKey} value={group.scopeKey}>
                      {group.label} ({group.total})
                    </option>
                  ))}
                </select>
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--accent)]"
                >
                  ↓
                </span>
              </span>
            </label>
          </div>
        ) : null}

        <div className="flex flex-col gap-2 border-b border-white/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent)]">
              Community ranking
            </p>
            <h2 className="responsive-text mt-1 font-display text-[clamp(1.35rem,5vw,1.75rem)] font-black uppercase leading-none tracking-[-0.04em]">
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
                className="group grid grid-cols-[2rem_4rem_minmax(0,1fr)_2.5rem] items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.035] sm:grid-cols-[2.5rem_4.25rem_minmax(0,1fr)_5rem_auto] sm:gap-4 sm:px-5 sm:py-3.5"
              >
                <p className="font-display text-xl font-black text-white/30 sm:text-3xl">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <div className="relative h-14 w-16 overflow-hidden bg-[#202832] sm:size-[4.25rem]">
                  <Image
                    src={row.image}
                    alt=""
                    fill
                    sizes="(min-width: 640px) 80px, 68px"
                    className="object-contain p-1.5 transition duration-300 group-hover:scale-[1.025]"
                  />
                </div>
                <div className="responsive-text">
                  {row.href ? (
                    <Link
                      href={row.href}
                      className="responsive-text block font-display text-sm font-black uppercase leading-tight tracking-[-0.025em] hover:text-[var(--accent)] focus-visible:outline-2 focus-visible:outline-[var(--accent)] min-[360px]:text-base sm:text-xl"
                    >
                      {row.name}
                    </Link>
                  ) : (
                    <h3 className="responsive-text font-display text-sm font-black uppercase leading-tight tracking-[-0.025em] min-[360px]:text-base sm:text-xl">
                      {row.name}
                    </h3>
                  )}
                  <span className="responsive-text mt-0.5 flex items-start gap-1.5 text-[9px] font-bold uppercase leading-4 tracking-[0.08em] text-[var(--muted)] sm:mt-1 sm:items-center sm:gap-2 sm:text-xs sm:tracking-[0.12em]">
                    {row.metaIcon ? (
                      <Image
                        src={row.metaIcon}
                        alt=""
                        width={18}
                        height={18}
                        className="size-3.5 object-contain sm:size-[18px]"
                      />
                    ) : null}
                    <span className="responsive-text">{row.meta}</span>
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
                    className="community-progress mt-2 block h-1 w-full sm:mt-3 sm:h-1.5"
                  />
                  <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--muted)] sm:hidden">
                    {row.percentage}% · {row.votes}{" "}
                    {row.votes === 1 ? "vote" : "votes"}
                  </p>
                </div>
                <div className="hidden text-right sm:block">
                  <p className="font-display text-2xl font-black">
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
          <div className="max-w-2xl px-5 py-7 sm:px-6">
            <p className="font-display text-2xl font-black uppercase tracking-[-0.04em]">
              The board is waiting
            </p>
            <p className="mt-3 max-w-lg text-sm leading-6 text-[var(--muted)]">
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
              className="valorant-action mt-5 inline-flex min-h-10 items-center border border-[var(--accent)] px-4 text-[11px] font-black uppercase tracking-[0.12em]"
            >
              Browse {CATEGORY_LABELS[category]}
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
