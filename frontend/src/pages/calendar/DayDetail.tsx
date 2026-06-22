import { format } from "date-fns";
import confetti from "canvas-confetti";
import { api } from "../../api/client";
import DeleteButton from "../../components/ui/DeleteButton";
import type { GEvent, GTask } from "../../types/calendar";
import type { DetailItem } from "./DetailDialog";

function burstConfetti(x: number, y: number) {
  confetti({
    particleCount: 80,
    spread: 70,
    startVelocity: 35,
    origin: { x: x / window.innerWidth, y: y / window.innerHeight },
  });
}

interface Props {
  day: Date;
  events: GEvent[];
  tasks: GTask[];
  onChanged: () => void;
  onOpen: (item: DetailItem) => void;
}

/** Side panel showing the selected day's events and tasks. */
export default function DayDetail({ day, events, tasks, onChanged, onOpen }: Props) {
  return (
    <aside className="glass p-4">
      <h3 className="text-sm font-semibold">{format(day, "EEEE, d MMM")}</h3>

      <h4 className="mt-4 mb-1 text-xs font-medium tracking-wide text-muted uppercase">Events</h4>
      {events.length === 0 && <p className="text-xs text-muted">No events.</p>}
      <ul className="mt-1 list-none p-0">
        {events.map((e) => (
          <li key={e.id} className="flex items-center justify-between gap-3 border-b border-border py-2">
            <button
              type="button"
              className="min-w-0 flex-1 truncate bg-transparent p-0 text-left text-sm text-text hover:text-accent"
              title="View details"
              onClick={() => onOpen({ kind: "event", event: e })}
            >
              {e.summary || "(untitled)"}
            </button>
            <DeleteButton
              onClick={async () => {
                await api.delete(`/calendar/events/${e.id}/`);
                onChanged();
              }}
            />
          </li>
        ))}
      </ul>

      <h4 className="mt-4 mb-1 text-xs font-medium tracking-wide text-muted uppercase">Tasks</h4>
      {tasks.length === 0 && <p className="text-xs text-muted">No tasks.</p>}
      <ul className="mt-1 list-none p-0">
        {tasks.map((t) => (
          <li key={t.id} className="flex items-center justify-between gap-3 border-b border-border py-2">
            <div className="flex min-w-0 flex-1 flex-row items-center gap-1.5 text-sm text-text">
              <input
                className="shrink-0"
                type="checkbox"
                aria-label={t.status === "completed" ? `Mark ${t.title} incomplete` : `Mark ${t.title} complete`}
                checked={t.status === "completed"}
                onChange={async (e) => {
                  if (e.target.checked) {
                    const r = e.target.getBoundingClientRect();
                    burstConfetti(r.left + r.width / 2, r.top + r.height / 2);
                  }
                  await api.patch(`/calendar/tasks/${t.id}/`, {
                    title: t.title,
                    due: t.due,
                    completed: e.target.checked,
                  });
                  onChanged();
                }}
              />
              <button
                type="button"
                className="min-w-0 truncate bg-transparent p-0 text-left text-sm text-text hover:text-accent"
                title="View details"
                onClick={() => onOpen({ kind: "task", task: t })}
              >
                {t.title}
              </button>
            </div>
            <DeleteButton
              onClick={async () => {
                await api.delete(`/calendar/tasks/${t.id}/`);
                onChanged();
              }}
            />
          </li>
        ))}
      </ul>
    </aside>
  );
}
