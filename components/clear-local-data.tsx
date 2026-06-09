"use client";

import { useState } from "react";

export function ClearLocalData() {
  const [cleared, setCleared] = useState(false);

  function clearData() {
    localStorage.removeItem("agentstats:recent");
    setCleared(true);
  }

  return (
    <div className="my-7 border-l-2 border-[var(--accent)] bg-[var(--panel)] p-5 sm:flex sm:items-center sm:justify-between sm:gap-8 sm:p-6">
      <div>
        <p className="font-display text-base font-black uppercase tracking-[0.04em] text-white">
          Recent searches on this device
        </p>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          AgentStats stores up to five recent Riot ID searches in this browser.
        </p>
      </div>
      <button
        type="button"
        onClick={clearData}
        className="valorant-action mt-5 min-h-11 shrink-0 border border-white/15 px-4 text-xs font-black uppercase tracking-[0.1em] text-white sm:mt-0"
      >
        {cleared ? "History cleared" : "Clear history"}
      </button>
    </div>
  );
}
