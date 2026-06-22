import { cn } from "../../lib/cn";

interface Props {
  /** Text shown between the previous/next buttons. */
  label: string;
  onPrev: () => void;
  onNext: () => void;
  prevAriaLabel?: string;
  nextAriaLabel?: string;
  /** Extra classes for the centered label (e.g. its min-width). */
  labelClassName?: string;
}

/** ‹ label › control used for cycling through months, alarms, etc. */
export default function Stepper({
  label,
  onPrev,
  onNext,
  prevAriaLabel,
  nextAriaLabel,
  labelClassName,
}: Props) {
  return (
    <div className="flex items-center gap-2">
      <button
        className="h-8 w-8 rounded-full bg-panel-2 p-0 text-text"
        aria-label={prevAriaLabel}
        onClick={onPrev}
      >
        ‹
      </button>
      <strong className={cn("text-center text-sm font-semibold", labelClassName)}>{label}</strong>
      <button
        className="h-8 w-8 rounded-full bg-panel-2 p-0 text-text"
        aria-label={nextAriaLabel}
        onClick={onNext}
      >
        ›
      </button>
    </div>
  );
}
