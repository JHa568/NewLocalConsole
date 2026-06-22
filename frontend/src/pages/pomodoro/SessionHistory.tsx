import { format, parseISO } from "date-fns";
import { usePomodoro } from "../../context/PomodoroContext";

/** Side panel listing completed focus sessions. */
export default function SessionHistory() {
  const { history } = usePomodoro();

  return (
    <aside className="glass flex flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">History</h3>
        <span className="text-xs tabular-nums text-muted">{history.length} done</span>
      </div>
      {history.length === 0 ? (
        <p className="text-xs text-muted">No completed sessions yet.</p>
      ) : (
        <ul className="m-0 flex flex-col gap-2 p-0">
          {history.map((s) => (
            <li
              key={s.id}
              className="flex items-start justify-between gap-3 rounded-xl bg-panel-2/60 px-3 py-2.5"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{s.task_title || "Untitled focus"}</div>
                <div className="text-xs text-muted">
                  {format(parseISO(s.completed_at), "d MMM, HH:mm")}
                </div>
              </div>
              <span className="shrink-0 pill bg-accent/20 text-accent">{s.duration_minutes}m</span>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
