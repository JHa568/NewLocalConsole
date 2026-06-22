import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

interface Props {
  /** Called when the backdrop is clicked. */
  onClose: () => void;
  /** Extra classes for the panel (sizing, layout, padding). */
  className?: string;
  children: ReactNode;
}

/**
 * Centered modal: a dimmed backdrop that closes on click, and a glass panel
 * that swallows clicks so they don't bubble up to the backdrop.
 */
export default function Modal({ onClose, className, children }: Props) {
  return (
    <div
      className="fixed inset-0 z-10 grid place-items-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className={cn("glass", className)} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
