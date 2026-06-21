import {
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import confetti from "canvas-confetti";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../api/client";

function burstConfetti(x: number, y: number) {
  confetti({
    particleCount: 80,
    spread: 70,
    startVelocity: 35,
    origin: {
      x: x / window.innerWidth,
      y: y / window.innerHeight,
    },
  });
}

interface GEvent {
  id: string;
  summary?: string;
  start: { date?: string; dateTime?: string };
  end?: { date?: string; dateTime?: string };
}
interface GTask {
  id: string;
  title?: string;
  due?: string;
  status?: string;
  notes?: string;
}

type CreateType = "event" | "all_day" | "task";

function eventDate(e: GEvent): Date {
  const raw = e.start.dateTime ?? e.start.date;
  return raw ? parseISO(raw) : new Date();
}

export default function CalendarPage() {
  const [cursor, setCursor] = useState(new Date());
  const [events, setEvents] = useState<GEvent[]>([]);
  const [tasks, setTasks] = useState<GTask[]>([]);
  const [selected, setSelected] = useState<Date>(new Date());
  const [connected, setConnected] = useState(true);
  const [showDialog, setShowDialog] = useState(false);

  const monthStart = startOfMonth(cursor);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(endOfMonth(cursor));

  const load = useCallback(async () => {
    try {
      const [ev, tk] = await Promise.all([
        api.get<GEvent[]>("/calendar/events/", {
          params: { start: gridStart.toISOString(), end: gridEnd.toISOString() },
        }),
        api.get<GTask[]>("/calendar/tasks/"),
      ]);
      setEvents(ev.data);
      setTasks(tk.data);
      setConnected(true);
    } catch (err: unknown) {
      if (
        typeof err === "object" &&
        err &&
        "response" in err &&
        (err as { response?: { status?: number } }).response?.status === 503
      ) {
        setConnected(false);
      }
    }
  }, [gridStart, gridEnd]);

  useEffect(() => {
    load();
  }, [load]);

  const days = useMemo(() => {
    const out: Date[] = [];
    let d = gridStart;
    while (d <= gridEnd) {
      out.push(d);
      d = new Date(d.getTime() + 24 * 3600 * 1000);
    }
    return out;
  }, [gridStart, gridEnd]);

  const eventsOn = (day: Date) => events.filter((e) => isSameDay(eventDate(e), day));
  const tasksOn = (day: Date) =>
    tasks.filter((t) => t.due && isSameDay(parseISO(t.due), day));

  return (
    <div className="p-3 sm:p-6" data-testid="calendar">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl">Calendar</h2>
        <div className="flex items-center gap-2">
          <button
            className="h-8 w-8 rounded-full bg-panel-2 p-0 text-text"
            onClick={() => setCursor(addMonths(cursor, -1))}
          >
            ‹
          </button>
          <strong className="min-w-[120px] text-center text-sm font-semibold">
            {format(cursor, "MMMM yyyy")}
          </strong>
          <button
            className="h-8 w-8 rounded-full bg-panel-2 p-0 text-text"
            onClick={() => setCursor(addMonths(cursor, 1))}
          >
            ›
          </button>
          <button className="ml-1" onClick={() => setShowDialog(true)}>
            + Add
          </button>
        </div>
      </div>

      {!connected && (
        <div className="glass mt-4 border-warm/30 bg-warm/10 p-4 text-sm">
          Google Calendar isn't connected yet. Run{" "}
          <code>python manage.py authorize_google</code> on the server.
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="p-1 text-center text-[10px] font-medium text-muted sm:text-xs">
              {d.slice(0, 3)}
            </div>
          ))}
          {days.map((day) => (
            <button
              key={day.toISOString()}
              className={[
                "flex min-h-[56px] flex-col items-stretch gap-1 rounded-xl border p-1 text-left text-text transition-colors sm:min-h-[92px] sm:p-1.5",
                isSameDay(day, selected)
                  ? "border-accent bg-panel-2"
                  : "border-border bg-panel hover:bg-panel-2/70",
                isSameMonth(day, cursor) ? "" : "opacity-40",
              ].join(" ")}
              onClick={() => setSelected(day)}
            >
              <span className="text-xs text-muted">{format(day, "d")}</span>
              {eventsOn(day).slice(0, 3).map((e) => (
                <span
                  key={e.id}
                  className="hidden overflow-hidden truncate rounded-full bg-accent/20 px-1.5 py-0.5 text-[11px] text-accent sm:block"
                  title={e.summary}
                >
                  {e.summary || "(untitled)"}
                </span>
              ))}
              {tasksOn(day).slice(0, 2).map((t) => (
                <span
                  key={t.id}
                  className="hidden overflow-hidden truncate rounded-full bg-warm/20 px-1.5 py-0.5 text-[11px] text-warm sm:block"
                  title={t.title}
                >
                  ☑ {t.title}
                </span>
              ))}
              {(eventsOn(day).length > 0 || tasksOn(day).length > 0) && (
                <span className="mt-auto h-1.5 w-1.5 self-center rounded-full bg-accent sm:hidden" />
              )}
            </button>
          ))}
        </div>

        <DayDetail
          day={selected}
          events={eventsOn(selected)}
          tasks={tasksOn(selected)}
          onChanged={load}
        />
      </div>

      {showDialog && (
        <CreateDialog
          defaultDate={selected}
          onClose={() => setShowDialog(false)}
          onCreated={() => {
            setShowDialog(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function DayDetail({
  day,
  events,
  tasks,
  onChanged,
}: {
  day: Date;
  events: GEvent[];
  tasks: GTask[];
  onChanged: () => void;
}) {
  return (
    <aside className="glass p-4">
      <h3 className="text-sm font-semibold">{format(day, "EEEE, d MMM")}</h3>
      <h4 className="mt-4 mb-1 text-xs font-medium tracking-wide text-muted uppercase">
        Events
      </h4>
      {events.length === 0 && <p className="text-xs text-muted">No events.</p>}
      <ul className="mt-1 list-none p-0">
        {events.map((e) => (
          <li
            key={e.id}
            className="flex items-center justify-between gap-3 border-b border-border py-2"
          >
            <span className="min-w-0 flex-1 truncate text-sm">{e.summary || "(untitled)"}</span>
            <button
              className="shrink-0 bg-bad/90 px-2 py-1 text-xs"
              onClick={async () => {
                await api.delete(`/calendar/events/${e.id}/`);
                onChanged();
              }}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
      <h4 className="mt-4 mb-1 text-xs font-medium tracking-wide text-muted uppercase">
        Tasks
      </h4>
      {tasks.length === 0 && <p className="text-xs text-muted">No tasks.</p>}
      <ul className="mt-1 list-none p-0">
        {tasks.map((t) => (
          <li
            key={t.id}
            className="flex items-center justify-between gap-3 border-b border-border py-2"
          >
            <label className="m-0 flex min-w-0 flex-1 flex-row items-center gap-1.5 text-sm text-text">
              <input
                className="shrink-0"
                type="checkbox"
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
              <span className="min-w-0 truncate">{t.title}</span>
            </label>
            <button
              className="shrink-0 bg-bad/90 px-2 py-1 text-xs"
              onClick={async () => {
                await api.delete(`/calendar/tasks/${t.id}/`);
                onChanged();
              }}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}

function CreateDialog({
  defaultDate,
  onClose,
  onCreated,
}: {
  defaultDate: Date;
  onClose: () => void;
  onCreated: () => void;
}) {
  const dateStr = format(defaultDate, "yyyy-MM-dd");
  const [type, setType] = useState<CreateType>("event");
  const [summary, setSummary] = useState("");
  const [date, setDate] = useState(dateStr);
  const [start, setStart] = useState(`${dateStr}T09:00`);
  const [end, setEnd] = useState(`${dateStr}T10:00`);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (type === "task") {
        await api.post("/calendar/tasks/", { title: summary, notes, due: date });
      } else if (type === "all_day") {
        await api.post("/calendar/events/", {
          summary,
          all_day: true,
          start: date,
        });
      } else {
        await api.post("/calendar/events/", {
          summary,
          all_day: false,
          start: `${start}:00`,
          end: `${end}:00`,
        });
      }
      onCreated();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-10 grid place-items-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <form
        className="glass w-[380px] max-w-[90vw] p-5"
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
      >
        <h3 className="mb-3 text-base">New item</h3>
        <div className="mb-2 flex gap-1 rounded-full bg-panel-2 p-1">
          {(["event", "all_day", "task"] as CreateType[]).map((t) => (
            <button
              type="button"
              key={t}
              className={
                type === t
                  ? "flex-1 rounded-full bg-accent px-2 py-1.5 text-xs text-ink"
                  : "flex-1 rounded-full bg-transparent px-2 py-1.5 text-xs text-muted"
              }
              onClick={() => setType(t)}
            >
              {t === "event" ? "Event" : t === "all_day" ? "All-day" : "Task"}
            </button>
          ))}
        </div>

        <label>
          {type === "task" ? "Title" : "Summary"}
          <input value={summary} onChange={(e) => setSummary(e.target.value)} required autoFocus />
        </label>

        {type === "event" && (
          <>
            <label>
              Start
              <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} required />
            </label>
            <label>
              End
              <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} required />
            </label>
          </>
        )}
        {(type === "all_day" || type === "task") && (
          <label>
            Date
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </label>
        )}
        {type === "task" && (
          <label>
            Notes
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
        )}

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            className="bg-transparent p-1 text-muted hover:text-text"
            onClick={onClose}
          >
            Cancel
          </button>
          <button type="submit" disabled={busy}>
            {busy ? "Saving…" : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}
