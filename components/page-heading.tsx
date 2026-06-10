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
    <div className={cn("motion-rise max-w-3xl", className)}>
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="mt-4 break-words font-display text-[clamp(2.4rem,12vw,4.5rem)] font-black uppercase leading-[0.88] tracking-[-0.06em]">
        {title}
      </h1>
      <p className="mt-6 max-w-2xl text-base leading-7 text-[var(--muted)] sm:text-lg">
        {description}
      </p>
    </div>
  );
}
