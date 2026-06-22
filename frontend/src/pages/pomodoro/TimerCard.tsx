import AmbientMusic from "../../components/AmbientMusic";
import { fmtClock } from "../../lib/format";
import { type Mode, usePomodoro } from "../../context/PomodoroContext";

const RADIUS = 130;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** The main timer panel: mode tabs, progress ring, controls and durations. */
export default function TimerCard({ onChooseTask }: { onChooseTask: () => void }) {
  const {
    mode,
    running,
    alarming,
    secondsLeft,
    overtime,
    totalSeconds,
    workMin,
    breakMin,
    task,
    start,
    pause,
    stop,
    reset,
    setMode,
    setWorkMin,
    setBreakMin,
  } = usePomodoro();

  const progress = alarming ? 1 : totalSeconds > 0 ? (totalSeconds - secondsLeft) / totalSeconds : 0;
  const ringColor = alarming
    ? "var(--color-bad)"
    : mode === "work"
      ? "var(--color-accent)"
      : "var(--color-good)";

  return (
    <div className="glass flex flex-col items-center gap-5 p-6 sm:p-8">
      <div className="flex gap-1 rounded-full bg-panel-2 p-1">
        {(["work", "break"] as Mode[]).map((m) => (
          <button
            key={m}
            disabled={running}
            className={
              mode === m
                ? "rounded-full bg-accent px-4 py-1.5 text-xs text-ink"
                : "rounded-full bg-transparent px-4 py-1.5 text-xs text-muted"
            }
            onClick={() => setMode(m)}
          >
            {m === "work" ? "Focus" : "Break"}
          </button>
        ))}
      </div>

      <div className="relative grid place-items-center">
        <svg width="300" height="300" viewBox="0 0 300 300" className="-rotate-90">
          <circle cx="150" cy="150" r={RADIUS} fill="none" stroke="var(--color-panel-2)" strokeWidth="14" />
          <circle
            cx="150"
            cy="150"
            r={RADIUS}
            fill="none"
            stroke={ringColor}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span
            className={[
              "text-[56px] font-bold tabular-nums leading-none",
              alarming ? "animate-pulse text-bad" : "",
            ].join(" ")}
          >
            {alarming ? `+${fmtClock(overtime)}` : fmtClock(secondsLeft)}
          </span>
          <span className="mt-2 text-xs tracking-wide text-muted uppercase">
            {alarming ? "Time's up" : mode === "work" ? "Focus" : "Break"}
          </span>
        </div>
      </div>

      {mode === "work" && (
        <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
          <span className="text-muted">Current task:</span>
          <span className="font-medium">{task.summary ?? "None"}</span>
          <button
            className="bg-panel-2 px-2.5 py-1 text-xs text-text"
            disabled={running}
            onClick={onChooseTask}
          >
            {task.summary ? "Change" : "Choose"}
          </button>
        </div>
      )}

      <div className="flex items-center gap-3">
        {alarming ? (
          <button className="animate-pulse bg-bad text-ink" onClick={stop}>
            Stop
          </button>
        ) : !running ? (
          <button onClick={start}>{secondsLeft < totalSeconds ? "Resume" : "Start"}</button>
        ) : (
          <button className="bg-warm text-ink" onClick={pause}>
            Pause
          </button>
        )}
        <button className="bg-panel-2 text-text" onClick={reset}>
          Reset
        </button>
      </div>

      <p className="text-center text-xs text-muted">Keeps running when you switch tabs or pages.</p>

      <div className="flex items-center gap-4 text-sm text-muted">
        <label className="m-0 flex-row items-center gap-2">
          Focus
          <input
            type="number"
            min={1}
            max={120}
            value={workMin}
            disabled={running}
            onChange={(e) => setWorkMin(Number(e.target.value) || 1)}
            className="w-16"
          />
          min
        </label>
        <label className="m-0 flex-row items-center gap-2">
          Break
          <input
            type="number"
            min={1}
            max={60}
            value={breakMin}
            disabled={running}
            onChange={(e) => setBreakMin(Number(e.target.value) || 1)}
            className="w-16"
          />
          min
        </label>
      </div>

      <AmbientMusic />
    </div>
  );
}
