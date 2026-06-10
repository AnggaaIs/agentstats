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
    <span className={cn("inline-flex items-center gap-2", className)}>
      {icon ? (
        <Image
          src={icon}
          alt=""
          width={20}
          height={20}
          className={cn("size-5 object-contain", iconClassName)}
        />
      ) : null}
      <span>{name}</span>
    </span>
  );
}
