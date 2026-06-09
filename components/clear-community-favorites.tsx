"use client";

import { useState } from "react";

export function ClearCommunityFavorites() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function clearFavorites() {
    setPending(true);
    setMessage("");

    try {
      const response = await fetch("/api/community/favorites", {
        method: "DELETE",
      });

      if (!response.ok) {
        setMessage("Your favorites could not be cleared.");
        return;
      }

      setMessage("Your community favorites were cleared.");
      window.location.reload();
    } catch {
      setMessage("Your favorites could not be cleared.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="border border-white/10 bg-[var(--panel)] p-5">
      <p className="text-sm leading-6 text-[var(--muted)]">
        Remove all three anonymous choices and the device identifier used to
        protect the vote.
      </p>
      <button
        type="button"
        disabled={pending}
        onClick={clearFavorites}
        className="valorant-action mt-4 min-h-11 border border-white/15 px-5 text-xs font-black uppercase tracking-[0.13em] disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? "Clearing" : "Clear my favorites"}
      </button>
      <p className="mt-3 text-xs text-[var(--muted)]" role="status">
        {message}
      </p>
    </div>
  );
}
