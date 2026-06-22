import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

interface Props {
  /** Heading shown at the top of the page. */
  title: string;
  /** Value for the page's `data-testid`, used by the test suite. */
  testId?: string;
  /** Optional controls rendered on the right of the heading row. */
  actions?: ReactNode;
  /** Extra classes for the outer padding container. */
  className?: string;
  children: ReactNode;
}

/**
 * Standard page shell: outer padding, a heading row (title + optional actions)
 * and the page body. Keeps every page's structure identical so individual
 * pages only describe their content.
 */
export default function Page({ title, testId, actions, className, children }: Props) {
  return (
    <div className={cn("p-3 sm:p-6", className)} data-testid={testId}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl">{title}</h2>
        {actions}
      </div>
      {children}
    </div>
  );
}
