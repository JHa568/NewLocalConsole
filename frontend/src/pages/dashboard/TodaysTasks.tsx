import Card from "../../components/ui/Card";
import type { GTask } from "../../types/calendar";

interface Props {
  tasks: GTask[];
  onComplete: (task: GTask) => void;
}

/** Card listing the tasks due today, each with a complete checkbox. */
export default function TodaysTasks({ tasks, onComplete }: Props) {
  return (
    <Card className="mb-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-xs font-medium tracking-wide text-muted uppercase">Today's tasks</div>
        <span className="text-xs tabular-nums text-muted">{tasks.length} due</span>
      </div>
      {tasks.length === 0 ? (
        <p className="text-sm text-muted">Nothing due today. 🎉</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {tasks.map((t) => (
            <li
              key={t.id}
              className="flex items-start gap-2.5 rounded-xl bg-panel-2/60 px-3 py-2.5"
            >
              <input
                type="checkbox"
                className="mt-0.5 shrink-0"
                checked={false}
                onChange={() => onComplete(t)}
                aria-label={`Mark "${t.title}" done`}
              />
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{t.title}</div>
                {t.notes && <div className="truncate text-xs text-muted">{t.notes}</div>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
