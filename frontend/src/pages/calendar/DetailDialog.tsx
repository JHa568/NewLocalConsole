import { format, parseISO } from "date-fns";
import Modal from "../../components/ui/Modal";
import type { GEvent, GTask } from "../../types/calendar";

export type DetailItem =
  | { kind: "event"; event: GEvent }
  | { kind: "task"; task: GTask };

interface Props {
  item: DetailItem;
  onClose: () => void;
}

function fmt(raw: string, withTime: boolean): string {
  return format(parseISO(raw), withTime ? "EEE, d MMM yyyy · HH:mm" : "EEE, d MMM yyyy");
}

function eventWhen(e: GEvent): string {
  const startRaw = e.start.dateTime ?? e.start.date;
  const endRaw = e.end?.dateTime ?? e.end?.date;
  if (!startRaw) return "—";
  const timed = Boolean(e.start.dateTime);
  const start = fmt(startRaw, timed);
  if (!endRaw) return start;
  // For all-day events Google stores the end date as exclusive; show start only.
  const end = fmt(endRaw, timed);
  return timed ? `${start} – ${format(parseISO(endRaw), "HH:mm")}` : end === start ? start : `${start} – ${end}`;
}

/** Read-only popup showing the full description and metadata for an event or task. */
export default function DetailDialog({ item, onClose }: Props) {
  const isEvent = item.kind === "event";
  const title = isEvent
    ? item.event.summary || "(untitled)"
    : item.task.title || "(untitled)";

  return (
    <Modal onClose={onClose} className="w-[420px] max-w-[90vw] p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="m-0 min-w-0 text-base break-words">{title}</h3>
        <button
          type="button"
          aria-label="Close"
          className="-mt-1 -mr-1 bg-transparent p-1 text-muted hover:text-text"
          onClick={onClose}
        >
          ✕
        </button>
      </div>

      <dl className="m-0 grid grid-cols-[80px_1fr] gap-x-3 gap-y-2 text-sm">
        <dt className="text-xs tracking-wide text-muted uppercase">Type</dt>
        <dd className="m-0">{isEvent ? "Event" : "Task"}</dd>

        {item.kind === "event" && (
          <>
            <dt className="text-xs tracking-wide text-muted uppercase">When</dt>
            <dd className="m-0">{eventWhen(item.event)}</dd>

            {item.event.location && (
              <>
                <dt className="text-xs tracking-wide text-muted uppercase">Where</dt>
                <dd className="m-0 break-words">{item.event.location}</dd>
              </>
            )}

            <dt className="text-xs tracking-wide text-muted uppercase">Notes</dt>
            <dd className="m-0 whitespace-pre-wrap break-words">
              {item.event.description || <span className="text-muted">No description.</span>}
            </dd>

            {item.event.htmlLink && (
              <>
                <dt className="text-xs tracking-wide text-muted uppercase">Link</dt>
                <dd className="m-0">
                  <a
                    href={item.event.htmlLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-accent underline"
                  >
                    Open in Google Calendar
                  </a>
                </dd>
              </>
            )}
          </>
        )}

        {item.kind === "task" && (
          <>
            <dt className="text-xs tracking-wide text-muted uppercase">Due</dt>
            <dd className="m-0">{item.task.due ? fmt(item.task.due, false) : "—"}</dd>

            <dt className="text-xs tracking-wide text-muted uppercase">Status</dt>
            <dd className="m-0">{item.task.status === "completed" ? "Completed" : "Open"}</dd>

            <dt className="text-xs tracking-wide text-muted uppercase">Notes</dt>
            <dd className="m-0 whitespace-pre-wrap break-words">
              {item.task.notes || <span className="text-muted">No notes.</span>}
            </dd>
          </>
        )}
      </dl>
    </Modal>
  );
}
