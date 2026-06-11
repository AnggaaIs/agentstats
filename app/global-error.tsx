"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-[#0b1016] text-[#f3f0e9]">
        <main className="mx-auto flex min-h-[70vh] max-w-3xl flex-col justify-center px-5 py-10">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#ff4655]">
            AgentStats
          </p>
          <h1 className="mt-4 text-4xl font-black uppercase tracking-[-0.05em]">
            The service could not open.
          </h1>
          <p className="mt-5 max-w-xl leading-7 text-[#9aa6b4]">
            Nothing was submitted. Try opening AgentStats again.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-8 min-h-12 w-fit border border-[#ff4655] bg-[#ff4655] px-6 text-sm font-black uppercase tracking-widest"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
