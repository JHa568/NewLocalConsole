import {
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import Notice from "../components/ui/Notice";
import Page from "../components/ui/Page";
import Stepper from "../components/ui/Stepper";
import type { GEvent, GTask } from "../types/calendar";
import CreateDialog from "./calendar/CreateDialog";
import DayDetail from "./calendar/DayDetail";
import type { DetailItem } from "./calendar/DetailDialog";
import DetailDialog from "./calendar/DetailDialog";
import MonthGrid from "./calendar/MonthGrid";

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
  const [detail, setDetail] = useState<DetailItem | null>(null);

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
  const tasksOn = (day: Date) => tasks.filter((t) => t.due && isSameDay(parseISO(t.due), day));

  const actions = (
    <div className="flex items-center gap-2">
      <Stepper
        label={format(cursor, "MMMM yyyy")}
        labelClassName="min-w-[120px]"
        onPrev={() => setCursor(addMonths(cursor, -1))}
        onNext={() => setCursor(addMonths(cursor, 1))}
      />
      <button className="ml-1" onClick={() => setShowDialog(true)}>
        + Add
      </button>
    </div>
  );

  return (
    <Page title="Calendar" testId="calendar" actions={actions}>
      {!connected && (
        <Notice>
          Google Calendar isn't connected yet. Run{" "}
          <code>python manage.py authorize_google</code> on the server.
        </Notice>
      )}

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">
        <MonthGrid
          days={days}
          cursor={cursor}
          selected={selected}
          eventsOn={eventsOn}
          tasksOn={tasksOn}
          onSelect={setSelected}
          onOpen={setDetail}
        />
        <DayDetail
          day={selected}
          events={eventsOn(selected)}
          tasks={tasksOn(selected)}
          onChanged={load}
          onOpen={setDetail}
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

      {detail && <DetailDialog item={detail} onClose={() => setDetail(null)} />}
    </Page>
  );
}
