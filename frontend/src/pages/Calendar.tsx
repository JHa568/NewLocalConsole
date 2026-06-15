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
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../api/client";

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
    <div className="page" data-testid="calendar">
      <div className="row spread">
        <h2>Calendar</h2>
        <div className="cal-controls">
          <button onClick={() => setCursor(addMonths(cursor, -1))}>‹</button>
          <strong>{format(cursor, "MMMM yyyy")}</strong>
          <button onClick={() => setCursor(addMonths(cursor, 1))}>›</button>
          <button onClick={() => setShowDialog(true)}>+ Add</button>
        </div>
      </div>

      {!connected && (
        <div className="card warn">
          Google Calendar isn't connected yet. Run{" "}
          <code>python manage.py authorize_google</code> on the server.
        </div>
      )}

      <div className="cal-layout">
        <div className="cal-grid">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="cal-head">
              {d}
            </div>
          ))}
          {days.map((day) => (
            <button
              key={day.toISOString()}
              className={[
                "cal-cell",
                isSameMonth(day, cursor) ? "" : "other-month",
                isSameDay(day, selected) ? "selected" : "",
              ].join(" ")}
              onClick={() => setSelected(day)}
            >
              <span className="cal-date">{format(day, "d")}</span>
              {eventsOn(day).slice(0, 3).map((e) => (
                <span key={e.id} className="chip event" title={e.summary}>
                  {e.summary || "(untitled)"}
                </span>
              ))}
              {tasksOn(day).slice(0, 2).map((t) => (
                <span key={t.id} className="chip task" title={t.title}>
                  ☑ {t.title}
                </span>
              ))}
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
    <aside className="cal-detail card">
      <h3>{format(day, "EEEE, d MMM")}</h3>
      <h4>Events</h4>
      {events.length === 0 && <p className="muted small">No events.</p>}
      <ul className="list">
        {events.map((e) => (
          <li key={e.id} className="row">
            <span>{e.summary || "(untitled)"}</span>
            <button
              className="danger small"
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
      <h4>Tasks</h4>
      {tasks.length === 0 && <p className="muted small">No tasks.</p>}
      <ul className="list">
        {tasks.map((t) => (
          <li key={t.id} className="row">
            <label className="inline">
              <input
                type="checkbox"
                checked={t.status === "completed"}
                onChange={async (e) => {
                  await api.patch(`/calendar/tasks/${t.id}/`, {
                    title: t.title,
                    due: t.due,
                    completed: e.target.checked,
                  });
                  onChanged();
                }}
              />
              {t.title}
            </label>
            <button
              className="danger small"
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
    <div className="modal-backdrop" onClick={onClose}>
      <form className="card modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h3>New item</h3>
        <div className="seg">
          {(["event", "all_day", "task"] as CreateType[]).map((t) => (
            <button
              type="button"
              key={t}
              className={type === t ? "active" : ""}
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

        <div className="row spread">
          <button type="button" className="link" onClick={onClose}>
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
