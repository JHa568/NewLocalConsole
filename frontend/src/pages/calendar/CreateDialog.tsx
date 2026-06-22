import { format } from "date-fns";
import { useState } from "react";
import { api } from "../../api/client";
import Modal from "../../components/ui/Modal";

type CreateType = "event" | "all_day" | "task";

interface Props {
  defaultDate: Date;
  onClose: () => void;
  onCreated: () => void;
}

/** Modal for creating a calendar event, all-day event, or task. */
export default function CreateDialog({ defaultDate, onClose, onCreated }: Props) {
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
        await api.post("/calendar/events/", { summary, all_day: true, start: date });
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
    <Modal onClose={onClose} className="w-[380px] max-w-[90vw] p-5">
      <form onSubmit={submit}>
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
    </Modal>
  );
}
