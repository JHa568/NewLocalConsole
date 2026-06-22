import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

/** Warm-toned inline banner for non-blocking warnings (e.g. "not connected"). */
export default function Notice({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("glass border-warm/30 bg-warm/10 p-4 text-sm", className)}>{children}</div>
  );
}
