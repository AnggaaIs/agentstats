import { RouteLink } from "@/components/route-link";

interface PaginationProps {
  page: number;
  totalPages: number;
  makeHref: (page: number) => string;
}

export function Pagination({ page, totalPages, makeHref }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter(
    (item) =>
      item === 1 ||
      item === totalPages ||
      Math.abs(item - page) <= 2,
  );

  return (
    <nav
      aria-label="Choose page"
      className="mt-10 flex flex-wrap items-center justify-center gap-2"
    >
      <RouteLink
        href={makeHref(Math.max(1, page - 1))}
        className="valorant-action min-h-11 border border-white/15 px-5 py-3 text-xs font-black uppercase tracking-widest"
      >
        Previous
      </RouteLink>
      {pages.map((item, index) => {
        const previous = pages[index - 1];
        return (
          <span key={item} className="contents">
            {previous && item - previous > 1 ? (
              <span className="px-2 text-[var(--muted)]">···</span>
            ) : null}
            <RouteLink
              href={makeHref(item)}
              current={item === page}
              className="valorant-action grid size-11 place-items-center border border-white/15 text-sm font-black"
            >
              {item}
            </RouteLink>
          </span>
        );
      })}
      <RouteLink
        href={makeHref(Math.min(totalPages, page + 1))}
        className="valorant-action min-h-11 border border-white/15 px-5 py-3 text-xs font-black uppercase tracking-widest"
      >
        Next
      </RouteLink>
    </nav>
  );
}
