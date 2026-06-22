import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

/** Small uppercase muted label used as a heading inside cards. */
export default function SectionLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("text-xs font-medium tracking-wide text-muted uppercase", className)}>
      {children}
    </div>
  );
}
