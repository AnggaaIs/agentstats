import Image from "next/image";

import { cn } from "@/lib/utils/cn";

interface AgentRoleLabelProps {
  name: string;
  icon?: string | null;
  className?: string;
  iconClassName?: string;
}

export function AgentRoleLabel({
  name,
  icon,
  className,
  iconClassName,
}: AgentRoleLabelProps) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full min-w-0 items-center gap-2",
        className,
      )}
    >
      {icon ? (
        <Image
          src={icon}
          alt=""
          width={20}
          height={20}
          className={cn("size-5 shrink-0 object-contain", iconClassName)}
        />
      ) : null}
      <span className="responsive-text min-w-0">{name}</span>
    </span>
  );
}
