"use client";

import { useId, useRef } from "react";

interface VideoPreviewModalProps {
  src: string;
  title: string;
  poster?: string | null;
  className?: string;
}

export function VideoPreviewModal({
  src,
  title,
  poster,
  className = "",
}: VideoPreviewModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const titleId = useId();

  function openModal() {
    dialogRef.current?.showModal();
    void videoRef.current?.play().catch(() => undefined);
  }

  function closeModal() {
    dialogRef.current?.close();
  }

  function resetVideo() {
    const video = videoRef.current;
    if (!video) return;

    video.pause();
    if (video.readyState > 0) video.currentTime = 0;
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className={`valorant-action inline-flex min-h-11 items-center justify-center gap-2 border border-white/15 px-4 text-[10px] font-black uppercase tracking-[0.14em] ${className}`}
      >
        <span
          aria-hidden="true"
          className="grid size-5 place-items-center border border-current"
        >
          <span className="ml-0.5 block size-0 border-y-[4px] border-l-[6px] border-y-transparent border-l-current" />
        </span>
        Preview video
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onClose={resetVideo}
        onClick={(event) => {
          if (event.target === dialogRef.current) closeModal();
        }}
        className="motion-dialog m-auto max-h-[calc(100dvh-2rem)] w-[min(72rem,calc(100%-1.25rem))] overflow-y-auto border-0 bg-transparent p-0 text-[var(--paper)] backdrop:bg-black/85 sm:w-[min(72rem,calc(100%-3rem))]"
      >
        <div className="motion-dialog-content overflow-hidden border border-white/15 bg-[#0c1117] shadow-2xl shadow-black/70">
          <header className="flex min-w-0 items-center justify-between gap-4 border-b border-white/10 px-4 py-3 sm:px-6 sm:py-4">
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[var(--accent)] sm:text-[10px]">
                In-game preview
              </p>
              <h2
                id={titleId}
                className="responsive-text mt-1 font-display text-base font-black uppercase tracking-[-0.025em] sm:text-xl"
              >
                {title}
              </h2>
            </div>
            <button
              type="button"
              onClick={closeModal}
              aria-label="Close video preview"
              className="valorant-action grid size-10 shrink-0 place-items-center border border-white/15 text-xl sm:size-11"
            >
              ×
            </button>
          </header>

          <div className="relative bg-black">
            <video
              ref={videoRef}
              controls
              playsInline
              preload="metadata"
              poster={poster ?? undefined}
              className="aspect-video max-h-[calc(100dvh-8rem)] w-full bg-black object-contain"
            >
              <source src={src} type="video/mp4" />
              Your browser does not support video playback.
            </video>
          </div>
        </div>
      </dialog>
    </>
  );
}
