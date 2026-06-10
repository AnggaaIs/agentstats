"use client";

import {
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import { cn } from "@/lib/utils/cn";

interface HorizontalScrollerProps {
  children: ReactNode;
  className?: string;
  viewportClassName?: string;
  ariaLabel: string;
  viewportRole?: "group" | "region";
}

interface ScrollMetrics {
  canScroll: boolean;
  progress: number;
  thumbRatio: number;
}

const INITIAL_METRICS: ScrollMetrics = {
  canScroll: false,
  progress: 0,
  thumbRatio: 1,
};

export function HorizontalScroller({
  children,
  className,
  viewportClassName,
  ariaLabel,
  viewportRole = "region",
}: HorizontalScrollerProps) {
  const viewportId = useId();
  const viewportRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const [metrics, setMetrics] = useState(INITIAL_METRICS);

  const syncMetrics = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const maxScroll = viewport.scrollWidth - viewport.clientWidth;
    const canScroll = maxScroll > 1;
    const thumbRatio = canScroll
      ? Math.max(0.12, viewport.clientWidth / viewport.scrollWidth)
      : 1;
    const progress = canScroll ? viewport.scrollLeft / maxScroll : 0;

    setMetrics((current) => {
      if (
        current.canScroll === canScroll &&
        Math.abs(current.progress - progress) < 0.001 &&
        Math.abs(current.thumbRatio - thumbRatio) < 0.001
      ) {
        return current;
      }

      return { canScroll, progress, thumbRatio };
    });
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const observer = new ResizeObserver(syncMetrics);
    observer.observe(viewport);
    Array.from(viewport.children).forEach((child) => observer.observe(child));
    viewport.addEventListener("scroll", syncMetrics, { passive: true });
    window.addEventListener("resize", syncMetrics);
    syncMetrics();

    return () => {
      observer.disconnect();
      viewport.removeEventListener("scroll", syncMetrics);
      window.removeEventListener("resize", syncMetrics);
    };
  }, [children, syncMetrics]);

  function scrollToProgress(progress: number) {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const boundedProgress = Math.min(1, Math.max(0, progress));
    viewport.scrollLeft =
      boundedProgress * (viewport.scrollWidth - viewport.clientWidth);
  }

  function updateFromPointer(event: PointerEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const pointerRatio = (event.clientX - bounds.left) / bounds.width;
    const availableRatio = 1 - metrics.thumbRatio;
    const nextProgress =
      availableRatio > 0
        ? (pointerRatio - metrics.thumbRatio / 2) / availableRatio
        : 0;

    scrollToProgress(nextProgress);
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    draggingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    updateFromPointer(event);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (draggingRef.current) updateFromPointer(event);
  }

  function handlePointerEnd(event: PointerEvent<HTMLDivElement>) {
    draggingRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const increments: Partial<Record<string, number>> = {
      ArrowLeft: -80,
      ArrowRight: 80,
      PageUp: -viewport.clientWidth * 0.8,
      PageDown: viewport.clientWidth * 0.8,
      Home: -viewport.scrollWidth,
      End: viewport.scrollWidth,
    };
    const increment = increments[event.key];
    if (increment === undefined) return;

    event.preventDefault();
    viewport.scrollLeft += increment;
  }

  const thumbOffset = metrics.progress * (1 - metrics.thumbRatio);

  return (
    <div className={cn("min-w-0", className)}>
      <div
        id={viewportId}
        ref={viewportRef}
        role={viewportRole}
        aria-label={ariaLabel}
        className={cn(
          "horizontal-scroll-viewport overflow-x-auto",
          viewportClassName,
        )}
      >
        {children}
      </div>

      {metrics.canScroll ? (
        <div
          role="scrollbar"
          aria-label={`${ariaLabel} scroll position`}
          aria-controls={viewportId}
          aria-orientation="horizontal"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(metrics.progress * 100)}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          className="relative mx-2 mb-2 mt-2 h-1.5 cursor-ew-resize touch-none bg-white/[0.07] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          <span
            className="absolute inset-y-0 bg-[var(--accent)] transition-[left] duration-75"
            style={{
              left: `${thumbOffset * 100}%`,
              width: `${metrics.thumbRatio * 100}%`,
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
