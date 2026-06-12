"use client";

import { useState } from "react";

import type {
  CommunityCount,
  FavoriteCategoryName,
} from "@/lib/community";
import { formatCompactNumber } from "@/lib/format-number";

interface FavoriteButtonProps {
  category: FavoriteCategoryName;
  scopeKey?: string;
  targetId: string;
  targetName: string;
  selected: boolean;
  selectedTargetId?: string | null;
  voteCount?: number;
  onChange?: (
    targetId: string | null,
    scopeKey: string,
    phase: "optimistic" | "confirmed" | "rollback",
    counts?: CommunityCount[],
  ) => void;
  className?: string;
  appearance?: "standard" | "compact" | "responsive";
}

interface VoteResponse {
  data: {
    selectedTargetId?: string | null;
    counts?: CommunityCount[];
  } | null;
  error: string | null;
}

export function FavoriteButton({
  category,
  scopeKey = "default",
  targetId,
  targetName,
  selected,
  selectedTargetId,
  voteCount,
  onChange,
  className = "",
  appearance = "standard",
}: FavoriteButtonProps) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const [internalSelected, setInternalSelected] = useState(selected);
  const [voteCountOverride, setVoteCountOverride] = useState<number | null>(
    null,
  );
  const isSelected = onChange ? selected : internalSelected;
  const displayedVoteCount = voteCountOverride ?? voteCount ?? 0;

  async function updateFavorite() {
    if (pending) return;

    const previousTarget =
      selectedTargetId === undefined
        ? isSelected
          ? targetId
          : null
        : selectedTargetId;
    const optimisticTarget = isSelected ? null : targetId;

    setPending(true);
    setMessage("");
    setFailed(false);
    onChange?.(optimisticTarget, scopeKey, "optimistic");
    setInternalSelected(Boolean(optimisticTarget));
    setVoteCountOverride(
      Math.max(0, displayedVoteCount + (isSelected ? -1 : 1)),
    );

    try {
      const response = await fetch(
        `/api/community/favorites${
          isSelected
            ? `?category=${encodeURIComponent(category)}&scopeKey=${encodeURIComponent(scopeKey)}`
            : ""
        }`,
        {
          method: isSelected ? "DELETE" : "POST",
          headers: isSelected
            ? undefined
            : { "Content-Type": "application/json" },
          body: isSelected
            ? undefined
            : JSON.stringify({ category, scopeKey, targetId, website: "" }),
        },
      );
      const payload = (await response.json()) as VoteResponse;

      if (!response.ok) {
        setMessage(payload.error ?? "Your favorite could not be updated.");
        setFailed(true);
        onChange?.(previousTarget, scopeKey, "rollback");
        setInternalSelected(previousTarget === targetId);
        setVoteCountOverride(null);
        return;
      }

      const confirmedTarget = isSelected
        ? null
        : (payload.data?.selectedTargetId ?? targetId);
      const confirmedCount =
        payload.data?.counts?.find((count) => count.targetId === targetId)
          ?.votes ??
        (isSelected
          ? Math.max(0, (voteCount ?? 0) - 1)
          : (voteCount ?? 0) + 1);
      onChange?.(
        confirmedTarget,
        scopeKey,
        "confirmed",
        payload.data?.counts,
      );
      setInternalSelected(confirmedTarget === targetId);
      setVoteCountOverride(confirmedCount);
      setMessage(
        isSelected
          ? `${targetName} was removed from your favorites.`
          : `${targetName} is now your favorite ${category}${category === "agent" ? ` for ${scopeKey}` : ""}.`,
      );
    } catch {
      setMessage("Your favorite could not be updated.");
      setFailed(true);
      onChange?.(previousTarget, scopeKey, "rollback");
      setInternalSelected(previousTarget === targetId);
      setVoteCountOverride(null);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        disabled={pending}
        aria-busy={pending}
        aria-pressed={isSelected}
        aria-label={`${isSelected ? "Remove" : "Choose"} ${targetName} as your favorite ${category}. ${displayedVoteCount} community ${displayedVoteCount === 1 ? "favorite" : "favorites"}.`}
        onClick={updateFavorite}
        className={`favorite-action valorant-action inline-flex items-center justify-center border font-black uppercase disabled:cursor-wait disabled:opacity-60 ${
          appearance === "compact"
            ? "min-h-11 min-w-11 gap-1.5 px-2"
            : appearance === "responsive"
              ? "min-h-10 min-w-12 gap-1.5 px-2 sm:min-h-11 sm:gap-2 sm:px-4 sm:text-[11px] sm:tracking-[0.13em]"
            : "min-h-11 gap-2 px-4 text-[11px] tracking-[0.13em]"
        } ${
          isSelected
            ? "border-[var(--accent)] bg-[var(--accent)] text-white"
            : "border-[color:rgba(255,70,85,0.55)] bg-[color:rgba(255,70,85,0.08)] text-[var(--accent)] hover:border-[var(--accent)] hover:bg-[color:rgba(255,70,85,0.16)] hover:text-white"
        }`}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className={`favorite-star size-4 ${
            isSelected ? "is-selected" : ""
          }`}
        >
          <path d="m12 2.8 2.74 5.55 6.13.89-4.44 4.32 1.05 6.11L12 16.79l-5.48 2.88 1.05-6.11-4.44-4.32 6.13-.89L12 2.8Z" />
        </svg>
        {appearance === "compact" ? (
          <span className="sr-only">
            {pending
              ? "Saving"
              : isSelected
                ? "Your favorite"
                : "Set as favorite"}
          </span>
        ) : appearance === "responsive" ? (
          <>
            <span className="sr-only sm:not-sr-only">
              {pending
                ? "Saving"
                : isSelected
                  ? "Your favorite"
                  : "Set as favorite"}
            </span>
          </>
        ) : (
          <span>
            {pending
              ? "Saving"
              : isSelected
                ? "Your favorite"
                : "Set as favorite"}
          </span>
        )}
        <span
          aria-hidden="true"
          title={`${displayedVoteCount.toLocaleString()} community favorites`}
          className="font-mono text-[10px] font-black lowercase tracking-[-0.02em] tabular-nums sm:text-[11px]"
        >
          {formatCompactNumber(displayedVoteCount)}
        </span>
      </button>
      <span
        className={
          failed
            ? "fixed bottom-5 right-5 z-[100] w-[min(22rem,calc(100vw-2.5rem))] border border-[var(--accent)] bg-[#0b1016] px-4 py-3 text-sm normal-case tracking-normal text-white shadow-2xl shadow-black/60"
            : "sr-only"
        }
        role={failed ? "alert" : "status"}
        aria-live={failed ? "assertive" : "polite"}
      >
        {message}
      </span>
    </div>
  );
}
