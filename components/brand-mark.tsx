import Image from "next/image";

import { cn } from "@/lib/utils/cn";

interface BrandMarkProps {
  className?: string;
}

export function BrandMark({ className }: BrandMarkProps) {
  return (
    <Image
      src="/brand/agentstats-mark.svg"
      alt=""
      width={36}
      height={36}
      priority
      aria-hidden="true"
      className={cn(
        "brand-pulse size-9 shrink-0",
        className,
      )}
    />
  );
}
