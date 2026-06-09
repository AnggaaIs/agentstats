"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";

import { BrandMark } from "@/components/brand-mark";
import { PlayerSearch } from "@/components/player-search";
import { RouteLink } from "@/components/route-link";
import { APP_NAME, NAV_ITEMS } from "@/lib/constants";

export function SiteHeader() {
  const pathname = usePathname();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  function openSearch() {
    setMenuOpen(false);
    dialogRef.current?.showModal();
  }

  function closeSearch() {
    dialogRef.current?.close();
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/8 bg-[color:var(--ink)/.94] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-5 lg:px-8">
          <Link
            href="/"
            className="flex min-h-11 shrink-0 items-center gap-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
          >
            <BrandMark />
            <span className="font-display text-lg font-black uppercase tracking-[-0.03em]">
              {APP_NAME}
            </span>
          </Link>

          <nav aria-label="Main navigation" className="hidden items-center gap-1 lg:flex">
            {NAV_ITEMS.map((item) => (
              <RouteLink
                key={item.href}
                href={item.href}
                current={pathname === item.href}
                className="valorant-action px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted)] transition hover:text-white focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
              >
                {item.label}
              </RouteLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openSearch}
              className="valorant-action hidden min-h-10 items-center border border-white/15 px-4 text-xs font-black uppercase tracking-[0.14em] sm:inline-flex"
            >
              Find player
            </button>
            <button
              type="button"
              onClick={openSearch}
              aria-label="Find player"
              className="valorant-action grid size-11 place-items-center border border-white/15 sm:hidden"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="size-5 fill-none stroke-current stroke-2"
              >
                <circle cx="11" cy="11" r="6" />
                <path d="m16 16 4 4" />
              </svg>
            </button>
            <button
              type="button"
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
              aria-label={menuOpen ? "Close navigation" : "Open navigation"}
              onClick={() => setMenuOpen((current) => !current)}
              className="valorant-action grid size-11 place-items-center border border-white/15 lg:hidden"
            >
              <span className="grid gap-1.5" aria-hidden="true">
                <span className="block h-0.5 w-5 bg-current" />
                <span className="block h-0.5 w-5 bg-current" />
                <span className="block h-0.5 w-5 bg-current" />
              </span>
            </button>
          </div>
        </div>

        {menuOpen ? (
          <nav
            id="mobile-navigation"
            aria-label="Mobile navigation"
            className="border-t border-white/8 bg-[var(--ink)] px-5 py-4 lg:hidden"
          >
            <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px border border-white/10 bg-white/10">
              {NAV_ITEMS.map((item) => (
                <RouteLink
                  key={item.href}
                  href={item.href}
                  current={pathname === item.href}
                  onClick={() => setMenuOpen(false)}
                  className="valorant-action flex min-h-14 items-center bg-[var(--panel)] px-4 text-xs font-black uppercase tracking-[0.12em] text-[var(--muted)]"
                >
                  {item.label}
                </RouteLink>
              ))}
            </div>
          </nav>
        ) : null}
      </header>

      <dialog
        ref={dialogRef}
        aria-labelledby="player-search-title"
        onClick={(event) => {
          if (event.target === dialogRef.current) closeSearch();
        }}
        className="m-auto w-[min(42rem,calc(100%-2rem))] border border-white/15 bg-[var(--panel)] p-0 text-[var(--paper)] shadow-2xl shadow-black/60 backdrop:bg-black/75"
      >
        <div className="border-b border-white/10 px-5 py-5 sm:px-7">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="eyebrow">Player lookup</p>
              <h2
                id="player-search-title"
                className="mt-4 font-display text-3xl font-black uppercase tracking-[-0.04em]"
              >
                Find a Riot account
              </h2>
            </div>
            <button
              type="button"
              onClick={closeSearch}
              aria-label="Close player search"
              className="valorant-action grid size-11 shrink-0 place-items-center border border-white/15 text-xl"
            >
              ×
            </button>
          </div>
        </div>
        <div className="p-5 sm:p-7">
          <PlayerSearch
            autoFocus
            idPrefix="header"
            onSubmitted={closeSearch}
            surface="plain"
          />
          <p className="mt-5 text-sm leading-6 text-[var(--muted)]">
            Use the player&apos;s Riot ID and choose the region where they play.
          </p>
        </div>
      </dialog>
    </>
  );
}
