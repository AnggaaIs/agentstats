import { cn } from "@/lib/utils/cn";

interface PageHeadingProps {
  eyebrow: string;
  title: string;
  description: string;
  className?: string;
}

export function PageHeading({
  eyebrow,
  title,
  description,
  className,
}: PageHeadingProps) {
  return (
    <div className={cn("motion-rise max-w-4xl", className)}>
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="mt-3 break-words font-display text-[clamp(2.35rem,7vw,3.75rem)] font-black uppercase leading-[0.9] tracking-[-0.055em]">
        {title}
      </h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted)] sm:text-base">
        {description}
      </p>
    </div>
  );
}
