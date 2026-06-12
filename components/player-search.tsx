"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

import { REGIONS } from "@/lib/constants";
import type { ApiResponse } from "@/lib/api-response";
import type { RiotAccountLookup } from "@/lib/riot";
import {
  playerLookupSchema,
  type PlayerLookupInput,
} from "@/lib/schemas";

interface PlayerSearchProps {
  autoFocus?: boolean;
  idPrefix?: string;
  onSubmitted?: () => void;
  surface?: "panel" | "plain";
}

interface RecentPlayer {
  name: string;
  tag: string;
  region: PlayerLookupInput["region"];
  searchedAt: number;
}

function readRecentPlayers(): RecentPlayer[] {
  try {
    const value = JSON.parse(
      localStorage.getItem("agentstats:recent") ?? "[]",
    );
    if (!Array.isArray(value)) return [];

    return value.filter(
      (item): item is RecentPlayer =>
        typeof item === "object" &&
        item !== null &&
        typeof item.name === "string" &&
        typeof item.tag === "string" &&
        typeof item.region === "string" &&
        typeof item.searchedAt === "number",
    );
  } catch {
    return [];
  }
}

export function PlayerSearch({
  autoFocus = false,
  idPrefix = "player",
  onSubmitted,
  surface = "panel",
}: PlayerSearchProps = {}) {
  const router = useRouter();
  const [riotId, setRiotId] = useState("");
  const [region, setRegion] =
    useState<PlayerLookupInput["region"]>("auto");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const inputId = `${idPrefix}-riot-id`;
  const errorId = `${idPrefix}-search-error`;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedRiotId = riotId.trim();
    const separator = normalizedRiotId.lastIndexOf("#");
    const result = playerLookupSchema.safeParse({
      name: separator > 0 ? normalizedRiotId.slice(0, separator) : "",
      tag: separator > 0 ? normalizedRiotId.slice(separator + 1) : "",
      region,
    });

    if (!result.success) {
      setError(
        result.error.issues[0]?.message ??
          "Enter a Riot ID like PlayerName#TAG.",
      );
      return;
    }

    setError("");
    startTransition(async () => {
      try {
        const search = new URLSearchParams(result.data);
        const response = await fetch(`/api/player?${search}`);
        const payload = (await response.json()) as ApiResponse<RiotAccountLookup>;

        if (!response.ok || !payload.data) {
          setError(payload.error ?? "Player search is unavailable.");
          return;
        }

        const player = {
          name: payload.data.account.gameName,
          tag: payload.data.account.tagLine,
          region: payload.data.region,
        };
        const recent = readRecentPlayers().filter(
          (item) =>
            item.name.toLocaleLowerCase() !== player.name.toLocaleLowerCase() ||
            item.tag.toLocaleLowerCase() !== player.tag.toLocaleLowerCase() ||
            item.region !== player.region,
        );
        localStorage.setItem(
          "agentstats:recent",
          JSON.stringify(
            [{ ...player, searchedAt: Date.now() }, ...recent].slice(0, 5),
          ),
        );
        onSubmitted?.();
        router.push(
          `/player/${player.region}/${encodeURIComponent(player.name)}/${encodeURIComponent(player.tag)}`,
        );
      } catch {
        setError("Player search is unavailable. Please try again.");
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={
        surface === "panel"
          ? "valorant-panel relative grid min-w-0 gap-2.5 p-2.5 shadow-xl shadow-black/20 sm:grid-cols-[minmax(0,1fr)_auto]"
          : "grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_auto]"
      }
      noValidate
    >
      <label className="sr-only" htmlFor={inputId}>
        Riot ID
      </label>
      <input
        id={inputId}
        value={riotId}
        onChange={(event) => setRiotId(event.target.value)}
        placeholder="PlayerName#TAG"
        autoComplete="off"
        autoFocus={autoFocus}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className="min-h-11 min-w-0 w-full border border-white/12 bg-black/20 px-4 text-sm font-bold text-white outline-none placeholder:text-[#65707e] focus-visible:border-[var(--accent)] sm:text-base"
      />
      <button
        type="submit"
        disabled={isPending}
        className="min-h-11 border border-[var(--accent)] bg-[var(--accent)] px-6 text-xs font-black uppercase tracking-[0.14em] transition hover:bg-[#e63e4c] disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        {isPending ? "Opening..." : "Find player"}
      </button>
      <fieldset className="grid min-w-0 w-full grid-cols-4 gap-2 sm:col-span-2 sm:flex sm:flex-wrap">
        <legend className="sr-only">Choose a region or detect it automatically</legend>
        {(["auto", ...REGIONS] as const).map((value) => (
          <label
            key={value}
            className={
              region === value
                ? "cursor-pointer border border-[var(--accent)] bg-[var(--accent)] px-1 py-2 text-center text-[10px] font-black uppercase tracking-wider sm:px-4 sm:text-xs sm:tracking-widest"
                : "cursor-pointer border border-white/12 bg-black/20 px-1 py-2 text-center text-[10px] font-black uppercase tracking-wider text-[var(--muted)] hover:border-white/40 hover:text-white sm:px-4 sm:text-xs sm:tracking-widest"
            }
          >
            <input
              type="radio"
              name="region"
              value={value}
              checked={region === value}
              onChange={() => setRegion(value)}
              className="sr-only"
            />
            {value}
          </label>
        ))}
      </fieldset>
      <p className="responsive-text min-w-0 text-xs leading-5 text-[var(--muted)] sm:col-span-2">
        Auto checks Asia, Americas, and Europe. Choose KR, BR, or LATAM
        manually when you need that exact match-history shard.
      </p>
      {error ? (
        <p id={errorId} role="alert" className="text-sm text-[#ff9aa2] sm:col-span-2">
          {error}
        </p>
      ) : null}
    </form>
  );
}
