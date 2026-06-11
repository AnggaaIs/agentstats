import Image from "next/image";

import { cn } from "@/lib/utils/cn";

interface ChoiceChipProps {
  label: string;
  icon?: string;
  checked: boolean;
  onChange: () => void;
}

export function ChoiceChip({ label, icon, checked, onChange }: ChoiceChipProps) {
  return (
    <label
      className={cn(
        "flex min-h-10 cursor-pointer items-center gap-2.5 border px-3.5 text-[11px] font-black uppercase tracking-[0.13em] transition",
        checked
          ? "border-[var(--accent)] bg-[var(--accent)] text-white"
          : "border-white/12 bg-white/[0.035] text-[var(--muted)] hover:border-white/40 hover:text-white",
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <span
        aria-hidden="true"
        className={cn(
          "grid size-3.5 place-items-center border",
          checked ? "border-white bg-white text-[var(--accent)]" : "border-white/30",
        )}
      >
        {checked ? <span className="size-2 bg-[var(--accent)]" /> : null}
      </span>
      {icon ? (
        <Image
          src={icon}
          alt=""
          width={16}
          height={16}
          className="size-4 object-contain"
        />
      ) : null}
      {label}
    </label>
  );
}
