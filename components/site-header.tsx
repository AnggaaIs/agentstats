"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { BrandMark } from "@/components/brand-mark";
import { PlayerSearch } from "@/components/player-search";
import { RouteLink } from "@/components/route-link";
import { APP_NAME, NAV_ITEMS } from "@/lib/constants";

export interface HeaderStatusNotice {
  severity: "critical" | "warning" | "info";
  title: string;
  message: string;
  date: string;
}

interface SiteHeaderProps {
  statusNotice: HeaderStatusNotice | null;
}

export function SiteHeader({ statusNotice }: SiteHeaderProps) {
  const pathname = usePathname();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  useEffect(() => {
    if (!statusOpen) return;

    function closeOnOutsideClick(event: MouseEvent) {
      if (
        event.target instanceof Node &&
        !statusRef.current?.contains(event.target)
      ) {
        setStatusOpen(false);
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [statusOpen]);

  function openSearch() {
    setMenuOpen(false);
    setStatusOpen(false);
    dialogRef.current?.showModal();
  }

  function closeSearch() {
    dialogRef.current?.close();
  }

  function toggleStatus() {
    setMenuOpen(false);
    setStatusOpen((current) => !current);
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
            <span className="hidden font-display text-lg font-black uppercase tracking-[-0.03em] xl:inline">
              {APP_NAME}
            </span>
          </Link>

          <nav aria-label="Main navigation" className="hidden items-center lg:flex">
            {NAV_ITEMS.map((item) => (
              <RouteLink
                key={item.href}
                href={item.href}
                current={pathname === item.href}
                onClick={() => {
                  setMenuOpen(false);
                  setStatusOpen(false);
                }}
                className="valorant-action px-2.5 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--muted)] transition hover:text-white focus-visible:outline-2 focus-visible:outline-[var(--accent)] xl:px-4 xl:text-xs xl:tracking-[0.16em]"
              >
                {item.label}
              </RouteLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {statusNotice ? (
              <div
                ref={statusRef}
                className="relative"
                onKeyDown={(event) => {
                  if (event.key === "Escape") setStatusOpen(false);
                }}
              >
                <button
                  type="button"
                  onClick={toggleStatus}
                  aria-expanded={statusOpen}
                  aria-controls="riot-status-panel"
                  aria-label={`Riot status: ${statusNotice.title}`}
                  className="valorant-action grid size-11 place-items-center border border-fuchsia-400/40 text-fuchsia-300"
                >
                  <span
                    aria-hidden="true"
                    className="grid size-5 rotate-45 place-items-center bg-fuchsia-500 text-[11px] font-black text-[#111319]"
                  >
                    <span className="-rotate-45">!</span>
                  </span>
                </button>

                {statusOpen ? (
                  <section
                    id="riot-status-panel"
                    aria-label="Riot service status"
                    className="motion-pop fixed left-4 right-4 top-[4.75rem] z-50 border border-black/10 bg-[#f5f3f0] p-7 text-[#38383b] shadow-2xl shadow-black/50 sm:absolute sm:left-auto sm:right-0 sm:top-[calc(100%+0.8rem)] sm:w-[21rem]"
                  >
                    <span
                      aria-hidden="true"
                      className="absolute -top-2 right-[6.4rem] size-4 rotate-45 border-l border-t border-black/10 bg-[#f5f3f0] sm:right-3"
                    />
                    <>
                      <p className="inline-flex items-center gap-2 bg-fuchsia-200 px-3 py-1 text-[11px] font-black uppercase tracking-[0.13em] text-[#624064]">
                        <span
                          aria-hidden="true"
                          className="grid size-3 rotate-45 place-items-center bg-[#624064] text-[8px] text-white"
                        >
                          <span className="-rotate-45">!</span>
                        </span>
                        {statusNotice.severity}
                      </p>
                      <h2 className="mt-5 text-xl font-black tracking-[0.02em]">
                        {statusNotice.title}
                      </h2>
                      <p className="mt-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#929296]">
                        {statusNotice.date}
                      </p>
                      <p className="mt-5 text-[15px] leading-6 tracking-[0.04em] text-[#47474b]">
                        {statusNotice.message}
                      </p>
                    </>
                    <RouteLink
                      href="/status"
                      onClick={() => setStatusOpen(false)}
                      className="mt-8 flex min-h-11 items-center justify-center bg-[#e8e6e4] px-5 text-xs font-black uppercase tracking-[0.14em] text-[#343438] transition hover:bg-[#ddd9d6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                    >
                      View more details
                    </RouteLink>
                  </section>
                ) : null}
              </div>
            ) : null}

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
              onClick={() => {
                setStatusOpen(false);
                setMenuOpen((current) => !current);
              }}
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
            className="motion-drop border-t border-white/8 bg-[var(--ink)] px-5 py-4 lg:hidden"
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
        className="motion-dialog m-auto w-[min(42rem,calc(100%-2rem))] border-0 bg-transparent p-0 text-[var(--paper)] backdrop:bg-black/75"
      >
        <div className="motion-dialog-content border border-white/15 bg-[var(--panel)] shadow-2xl shadow-black/60">
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
              Use the player&apos;s Riot ID and choose the region where they
              play.
            </p>
          </div>
        </div>
      </dialog>
    </>
  );
}
