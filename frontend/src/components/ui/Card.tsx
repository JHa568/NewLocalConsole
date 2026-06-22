import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

const PADDING = {
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
  none: "",
} as const;

interface Props {
  /** Padding size. Defaults to `md` (p-5). */
  padding?: keyof typeof PADDING;
  className?: string;
  children: ReactNode;
}

/** Frosted "glass" surface used for every panel/section across the app. */
export default function Card({ padding = "md", className, children }: Props) {
  return <div className={cn("glass", PADDING[padding], className)}>{children}</div>;
}
