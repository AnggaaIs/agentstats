"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

import { RouteLink } from "@/components/route-link";
import { cn } from "@/lib/utils/cn";

export interface RouteSelectOption {
  value: string;
  label: string;
  href?: string;
  icon?: string | null;
  note?: string;
  disabled?: boolean;
}

interface RouteSelectProps {
  label: string;
  selectedValue: string;
  options: RouteSelectOption[];
  className?: string;
  onValueChange?: (value: string) => void;
}

export function RouteSelect({
  label,
  selectedValue,
  options,
  className,
  onValueChange,
}: RouteSelectProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const selected =
    options.find((option) => option.value === selectedValue) ?? options[0];

  useEffect(() => {
    detailsRef.current?.removeAttribute("open");
  }, [selectedValue]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const details = detailsRef.current;
      if (
        details?.hasAttribute("open") &&
        event.target instanceof Node &&
        !details.contains(event.target)
      ) {
        details.removeAttribute("open");
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        detailsRef.current?.removeAttribute("open");
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  if (!selected) return null;

  return (
    <details
      ref={detailsRef}
      className={cn(
        "group relative z-20 min-w-0 open:z-40",
        className,
      )}
    >
      <summary className="valorant-action flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 border border-white/12 px-4 text-left [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">
          <span className="block text-[9px] font-black uppercase tracking-[0.14em] text-[var(--muted)]">
            {label}
          </span>
          <span className="mt-1 flex min-w-0 items-center gap-2">
            {selected.icon ? (
              <Image
                src={selected.icon}
                alt=""
                width={20}
                height={20}
                className="size-5 shrink-0 object-contain"
              />
            ) : null}
            <span className="responsive-text block text-xs font-black uppercase leading-tight tracking-[0.1em]">
              {selected.label}
            </span>
          </span>
        </span>
        <span
          aria-hidden="true"
          className="shrink-0 text-lg leading-none text-[var(--accent)] transition-transform group-open:rotate-45"
        >
          +
        </span>
      </summary>

      <div className="relative inset-x-0 z-30 grid max-h-64 overflow-y-auto border-x border-b border-white/12 bg-[var(--panel-raised)] p-2 shadow-2xl shadow-black/60 sm:absolute sm:top-full sm:max-h-80">
        {options.map((option) => {
          const current = option.value === selectedValue;
          const content = (
            <>
              <span className="flex min-w-0 items-center gap-2">
                {option.icon ? (
                  <Image
                    src={option.icon}
                    alt=""
                    width={20}
                    height={20}
                    className="size-5 shrink-0 object-contain"
                  />
                ) : null}
                <span className="responsive-text">{option.label}</span>
              </span>
              {option.note ? (
                <span className="ml-3 shrink-0 text-[9px] font-black uppercase tracking-[0.1em] opacity-55">
                  {option.note}
                </span>
              ) : null}
            </>
          );

          if (option.disabled) {
            return (
              <span
                key={option.value}
                aria-disabled="true"
                className="flex min-h-11 items-center justify-between border-b border-white/8 px-3 py-2 text-[10px] font-black uppercase tracking-[0.1em] text-white/35 last:border-b-0"
              >
                {content}
              </span>
            );
          }

          if (onValueChange) {
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={current}
                onClick={() => {
                  onValueChange(option.value);
                  detailsRef.current?.removeAttribute("open");
                }}
                className={`valorant-action flex min-h-11 w-full items-center justify-between border-b border-white/8 px-3 py-2 text-left text-[10px] font-black uppercase tracking-[0.1em] last:border-b-0 ${
                  current ? "bg-white/[0.06]" : ""
                }`}
              >
                {content}
              </button>
            );
          }

          if (current) {
            return (
              <button
                key={option.value}
                type="button"
                aria-current="page"
                onClick={() => detailsRef.current?.removeAttribute("open")}
                className="valorant-action flex min-h-11 w-full items-center justify-between border-b border-white/8 bg-white/[0.06] px-3 py-2 text-left text-[10px] font-black uppercase tracking-[0.1em] last:border-b-0"
              >
                {content}
              </button>
            );
          }

          if (!option.href) {
            return null;
          }

          return (
            <RouteLink
              key={option.value}
              href={option.href}
              className="valorant-action flex min-h-11 items-center justify-between border-b border-white/8 px-3 py-2 text-left text-[10px] font-black uppercase tracking-[0.1em] last:border-b-0"
            >
              {content}
            </RouteLink>
          );
        })}
      </div>
    </details>
  );
}
