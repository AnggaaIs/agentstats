"use client";

import Link from "next/link";
import { useLinkStatus } from "next/link";
import type { MouseEventHandler, ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

interface RouteLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  current?: boolean;
  prefetch?: boolean;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}

function WaitingMark() {
  const { pending } = useLinkStatus();

  return pending ? (
    <span
      role="status"
      aria-label="Opening page"
      className="absolute inset-x-0 bottom-0 h-1 origin-left bg-white route-wait"
    />
  ) : null;
}

export function RouteLink({
  href,
  children,
  className,
  current,
  prefetch,
  onClick,
}: RouteLinkProps) {
  return (
    <Link
      href={href}
      prefetch={prefetch}
      aria-current={current ? "page" : undefined}
      className={cn("relative", className)}
      onClick={onClick}
    >
      {children}
      <WaitingMark />
    </Link>
  );
}
