import { endOfDay, isSameDay, parseISO, startOfDay } from "date-fns";
import { useEffect, useState } from "react";
import { api } from "../../api/client";
import Modal from "../../components/ui/Modal";
import type { CurrentTask } from "../../context/PomodoroContext";
import type { GEvent, GTask } from "../../types/calendar";

interface Props {
  onClose: () => void;
  onPick: (task: CurrentTask) => void;
  onClear: () => void;
}

function PickRow({
  id,
  label,
  kind,
  onPick,
}: {
  id: string;
  label: string;
  kind: string;
  onPick: (task: CurrentTask) => void;
}) {
  return (
    <button
      type="button"
      className="flex w-full items-center justify-between gap-3 rounded-xl bg-panel-2/60 px-3 py-2.5 text-left text-text hover:bg-panel-2"
      onClick={() => onPick({ event_id: id, summary: label })}
    >
      <span className="min-w-0 truncate text-sm font-medium">{label}</span>
      <span className="shrink-0 pill bg-accent/20 text-accent">{kind}</span>
    </button>
  );
}

/** Modal that lists today's events and tasks to attach to a focus session. */
export default function TaskPickerModal({ onClose, onPick, onClear }: Props) {
  const [events, setEvents] = useState<GEvent[]>([]);
  const [tasks, setTasks] = useState<GTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(true);

  useEffect(() => {
    const today = new Date();
    (async () => {
      try {
        const [ev, tk] = await Promise.all([
          api.get<GEvent[]>("/calendar/events/", {
            params: { start: startOfDay(today).toISOString(), end: endOfDay(today).toISOString() },
          }),
          api.get<GTask[]>("/calendar/tasks/"),
        ]);
        setEvents(ev.data);
        setTasks(tk.data);
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 503) setConnected(false);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const today = new Date();
  const todaysTasks = tasks.filter((t) => t.due && isSameDay(parseISO(t.due), today));

  return (
    <Modal onClose={onClose} className="flex max-h-[80vh] w-[420px] max-w-[92vw] flex-col p-5">
      <h3 className="mb-3 text-base">Choose a task</h3>

      {!connected && (
        <p className="text-sm text-muted">
          Google Calendar isn't connected. Connect it to pick from your calendar.
        </p>
      )}

      <div className="flex flex-col gap-4 overflow-auto">
        {loading && <p className="text-sm text-muted">Loading…</p>}

        {!loading && connected && (
          <>
            <section>
              <h4 className="mb-1.5 text-xs font-medium tracking-wide text-muted uppercase">
                Today's events
              </h4>
              {events.length === 0 ? (
                <p className="text-xs text-muted">No events today.</p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {events.map((e) => (
                    <PickRow key={e.id} id={e.id} label={e.summary || "(untitled)"} kind="event" onPick={onPick} />
                  ))}
                </div>
              )}
            </section>

            <section>
              <h4 className="mb-1.5 text-xs font-medium tracking-wide text-muted uppercase">
                Tasks due today
              </h4>
              {todaysTasks.length === 0 ? (
                <p className="text-xs text-muted">No tasks due today.</p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {todaysTasks.map((t) => (
                    <PickRow key={t.id} id={t.id} label={t.title || "(untitled)"} kind="task" onPick={onPick} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3">
        <button type="button" className="bg-transparent p-1 text-muted hover:text-text" onClick={onClear}>
          Clear task
        </button>
        <button type="button" className="bg-panel-2 text-text" onClick={onClose}>
          Cancel
        </button>
      </div>
    </Modal>
  );
}
