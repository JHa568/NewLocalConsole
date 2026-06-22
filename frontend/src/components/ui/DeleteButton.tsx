import { cn } from "../../lib/cn";

interface Props {
  onClick: () => void;
  /** Button text. Defaults to "Delete". */
  label?: string;
  className?: string;
}

/** Compact destructive button used to remove list rows. */
export default function DeleteButton({ onClick, label = "Delete", className }: Props) {
  return (
    <button
      type="button"
      className={cn("shrink-0 bg-bad/90 px-2 py-1 text-xs", className)}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
