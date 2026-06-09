"use client";

import { useState } from "react";

import type { FavoriteCategoryName } from "@/lib/community";

interface FavoriteButtonProps {
  category: FavoriteCategoryName;
  targetId: string;
  targetName: string;
  selected: boolean;
  onChange?: (targetId: string | null) => void;
  className?: string;
  appearance?: "standard" | "compact";
}

interface VoteResponse {
  data: {
    selectedTargetId?: string | null;
  } | null;
  error: string | null;
}

export function FavoriteButton({
  category,
  targetId,
  targetName,
  selected,
  onChange,
  className = "",
  appearance = "standard",
}: FavoriteButtonProps) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const [internalSelected, setInternalSelected] = useState(selected);
  const isSelected = onChange ? selected : internalSelected;

  async function updateFavorite() {
    if (pending) return;

    setPending(true);
    setMessage("");
    setFailed(false);

    try {
      const response = await fetch(
        `/api/community/favorites${
          isSelected ? `?category=${encodeURIComponent(category)}` : ""
        }`,
        {
          method: isSelected ? "DELETE" : "POST",
          headers: isSelected
            ? undefined
            : { "Content-Type": "application/json" },
          body: isSelected
            ? undefined
            : JSON.stringify({ category, targetId, website: "" }),
        },
      );
      const payload = (await response.json()) as VoteResponse;

      if (!response.ok) {
        setMessage(payload.error ?? "Your favorite could not be updated.");
        setFailed(true);
        return;
      }

      const nextTarget = isSelected
        ? null
        : (payload.data?.selectedTargetId ?? targetId);
      onChange?.(nextTarget);
      setInternalSelected(Boolean(nextTarget));
      setMessage(
        isSelected
          ? `${targetName} was removed from your favorites.`
          : `${targetName} is now your favorite ${category}.`,
      );
    } catch {
      setMessage("Your favorite could not be updated.");
      setFailed(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        disabled={pending}
        aria-pressed={isSelected}
        aria-label={
          isSelected
            ? `Remove ${targetName} as your favorite ${category}`
            : `Choose ${targetName} as your favorite ${category}`
        }
        onClick={updateFavorite}
        className={`favorite-action valorant-action inline-flex items-center justify-center border font-black uppercase disabled:cursor-wait disabled:opacity-60 ${
          appearance === "compact"
            ? "size-11 p-0"
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
        ) : (
          <span>
            {pending
              ? "Saving"
              : isSelected
                ? "Your favorite"
                : "Set as favorite"}
          </span>
        )}
      </button>
      <span
        className={
          failed
            ? "absolute right-0 top-full z-30 mt-2 w-60 border border-[var(--accent)] bg-[#0b1016] px-3 py-2 text-xs normal-case tracking-normal text-white shadow-xl"
            : "sr-only"
        }
        role="status"
        aria-live="polite"
      >
        {message}
      </span>
    </div>
  );
}
