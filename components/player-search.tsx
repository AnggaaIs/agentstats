"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

import { REGIONS, type Region } from "@/lib/constants";
import { playerSearchSchema } from "@/lib/schemas";

interface PlayerSearchProps {
  autoFocus?: boolean;
  idPrefix?: string;
  onSubmitted?: () => void;
  surface?: "panel" | "plain";
}

export function PlayerSearch({
  autoFocus = false,
  idPrefix = "player",
  onSubmitted,
  surface = "panel",
}: PlayerSearchProps = {}) {
  const router = useRouter();
  const [riotId, setRiotId] = useState("");
  const [region, setRegion] = useState<Region>("ap");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const inputId = `${idPrefix}-riot-id`;
  const errorId = `${idPrefix}-search-error`;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const separator = riotId.lastIndexOf("#");
    const result = playerSearchSchema.safeParse({
      name: separator > 0 ? riotId.slice(0, separator) : "",
      tag: separator > 0 ? riotId.slice(separator + 1) : "",
      region,
    });

    if (!result.success) {
      setError("Enter a Riot ID like PlayerName#TAG.");
      return;
    }

    setError("");
    const recent = JSON.parse(localStorage.getItem("agentstats:recent") ?? "[]") as unknown[];
    localStorage.setItem(
      "agentstats:recent",
      JSON.stringify(
        [{ ...result.data, searchedAt: Date.now() }, ...recent].slice(0, 5),
      ),
    );
    onSubmitted?.();
    startTransition(() => {
      router.push(
        `/player/${result.data.region}/${encodeURIComponent(result.data.name)}/${encodeURIComponent(result.data.tag)}`,
      );
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={
        surface === "panel"
          ? "valorant-panel relative grid gap-3 p-3 shadow-xl shadow-black/20 sm:grid-cols-[1fr_auto]"
          : "grid gap-3 sm:grid-cols-[1fr_auto]"
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
        className="min-h-14 border border-white/12 bg-black/20 px-4 text-lg font-bold text-white outline-none placeholder:text-[#65707e] focus-visible:border-[var(--accent)]"
      />
      <button
        type="submit"
        disabled={isPending}
        className="min-h-14 border border-[var(--accent)] bg-[var(--accent)] px-7 text-sm font-black uppercase tracking-[0.14em] transition hover:bg-[#e63e4c] disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        {isPending ? "Opening..." : "Find player"}
      </button>
      <fieldset className="flex flex-wrap gap-2 sm:col-span-2">
        <legend className="sr-only">Choose region</legend>
        {REGIONS.map((value) => (
          <label
            key={value}
            className={
              region === value
                ? "cursor-pointer border border-[var(--accent)] bg-[var(--accent)] px-4 py-2 text-xs font-black uppercase tracking-widest"
                : "cursor-pointer border border-white/12 bg-black/20 px-4 py-2 text-xs font-black uppercase tracking-widest text-[var(--muted)] hover:border-white/40 hover:text-white"
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
      {error ? (
        <p id={errorId} role="alert" className="text-sm text-[#ff9aa2] sm:col-span-2">
          {error}
        </p>
      ) : null}
    </form>
  );
}
