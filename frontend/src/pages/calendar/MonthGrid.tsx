import { format, isSameDay, isSameMonth } from "date-fns";
import { cn } from "../../lib/cn";
import type { GEvent, GTask } from "../../types/calendar";
import type { DetailItem } from "./DetailDialog";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface Props {
  days: Date[];
  cursor: Date;
  selected: Date;
  eventsOn: (day: Date) => GEvent[];
  tasksOn: (day: Date) => GTask[];
  onSelect: (day: Date) => void;
  onOpen: (item: DetailItem) => void;
}

/** The month's day grid with weekday headers and per-day event/task chips. */
export default function MonthGrid({ days, cursor, selected, eventsOn, tasksOn, onSelect, onOpen }: Props) {
  return (
    <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
      {WEEKDAYS.map((d) => (
        <div key={d} className="p-1 text-center text-[10px] font-medium text-muted sm:text-xs">
          {d.slice(0, 3)}
        </div>
      ))}
      {days.map((day) => {
        const events = eventsOn(day);
        const tasks = tasksOn(day);
        return (
          <button
            key={day.toISOString()}
            className={cn(
              "flex min-h-[56px] flex-col items-stretch gap-1 rounded-xl border p-1 text-left text-text transition-colors sm:min-h-[92px] sm:p-1.5",
              isSameDay(day, selected)
                ? "border-accent bg-panel-2"
                : "border-border bg-panel hover:bg-panel-2/70",
              isSameMonth(day, cursor) ? "" : "opacity-40",
            )}
            onClick={() => onSelect(day)}
          >
            <span className="text-xs text-muted">{format(day, "d")}</span>
            {events.slice(0, 3).map((e) => (
              <span
                key={e.id}
                role="button"
                tabIndex={-1}
                className="hidden cursor-pointer overflow-hidden truncate rounded-full bg-accent/20 px-1.5 py-0.5 text-[11px] text-accent hover:bg-accent/30 sm:block"
                title={e.summary}
                onClick={(ev) => {
                  ev.stopPropagation();
                  onOpen({ kind: "event", event: e });
                }}
              >
                {e.summary || "(untitled)"}
              </span>
            ))}
            {tasks.slice(0, 2).map((t) => (
              <span
                key={t.id}
                role="button"
                tabIndex={-1}
                className="hidden cursor-pointer overflow-hidden truncate rounded-full bg-warm/20 px-1.5 py-0.5 text-[11px] text-warm hover:bg-warm/30 sm:block"
                title={t.title}
                onClick={(ev) => {
                  ev.stopPropagation();
                  onOpen({ kind: "task", task: t });
                }}
              >
                ☑ {t.title}
              </span>
            ))}
            {(events.length > 0 || tasks.length > 0) && (
              <span className="mt-auto h-1.5 w-1.5 self-center rounded-full bg-accent sm:hidden" />
            )}
          </button>
        );
      })}
    </div>
  );
}
