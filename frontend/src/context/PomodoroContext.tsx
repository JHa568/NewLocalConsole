import confetti from "canvas-confetti";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { api } from "../api/client";
import { playAlarm, primeAudio } from "../lib/alarms";

export type Mode = "work" | "break";

export interface CurrentTask {
  event_id: string | null;
  summary: string | null;
}

export interface PomoSession {
  id: number;
  task_title: string;
  calendar_event_id: string;
  duration_minutes: number;
  started_at: string;
  completed_at: string;
}

interface PomodoroValue {
  mode: Mode;
  running: boolean;
  alarming: boolean;
  secondsLeft: number;
  overtime: number;
  totalSeconds: number;
  workMin: number;
  breakMin: number;
  task: CurrentTask;
  connected: boolean;
  history: PomoSession[];
  start: () => void;
  pause: () => void;
  stop: () => void;
  reset: () => void;
  setMode: (m: Mode) => void;
  setWorkMin: (n: number) => void;
  setBreakMin: (n: number) => void;
  setTask: (t: CurrentTask) => void;
  reloadHistory: () => void;
}

const STORAGE_KEY = "nlc.pomo";
const ALARM_REPEAT_MS = 1600;
const NO_TASK: CurrentTask = { event_id: null, summary: null };

const PomodoroContext = createContext<PomodoroValue | null>(null);

interface Persisted {
  mode: Mode;
  running: boolean;
  endTime: number | null;
  remaining: number;
  workMin: number;
  breakMin: number;
  startedAt: string | null;
  task: CurrentTask;
}

interface InitState extends Persisted {
  alarming: boolean;
  overtime: number;
}

function loadInitial(): InitState {
  const base: InitState = {
    mode: "work",
    running: false,
    endTime: null,
    remaining: 25 * 60,
    workMin: 25,
    breakMin: 5,
    startedAt: null,
    task: NO_TASK,
    alarming: false,
    overtime: 0,
  };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return base;
    const s = JSON.parse(raw) as Partial<Persisted>;
    const workMin = s.workMin ?? 25;
    const breakMin = s.breakMin ?? 5;
    const mode: Mode = s.mode === "break" ? "break" : "work";
    const total = (mode === "work" ? workMin : breakMin) * 60;
    const common = {
      mode,
      workMin,
      breakMin,
      startedAt: s.startedAt ?? null,
      task: s.task ?? NO_TASK,
    };

    if (s.running && s.endTime) {
      const diffMs = s.endTime - Date.now();
      if (diffMs > 0) {
        // Still counting down.
        return {
          ...common,
          running: true,
          endTime: s.endTime,
          remaining: Math.round(diffMs / 1000),
          alarming: false,
          overtime: 0,
        };
      }
      // Deadline passed while away — resume in overtime/alarming.
      return {
        ...common,
        running: true,
        endTime: s.endTime,
        remaining: 0,
        alarming: true,
        overtime: Math.floor(-diffMs / 1000),
      };
    }
    return {
      ...common,
      running: false,
      endTime: null,
      remaining: typeof s.remaining === "number" ? s.remaining : total,
      alarming: false,
      overtime: 0,
    };
  } catch {
    return base;
  }
}

export function PomodoroProvider({ children }: { children: React.ReactNode }) {
  const init = useRef(loadInitial()).current;

  const [mode, setModeState] = useState<Mode>(init.mode);
  const [workMin, setWorkMinState] = useState(init.workMin);
  const [breakMin, setBreakMinState] = useState(init.breakMin);
  const [running, setRunning] = useState(init.running);
  const [alarming, setAlarming] = useState(init.alarming);
  const [secondsLeft, setSecondsLeft] = useState(init.remaining);
  const [overtime, setOvertime] = useState(init.overtime);
  const [task, setTask] = useState<CurrentTask>(init.task);
  const [connected, setConnected] = useState(true);
  const [history, setHistory] = useState<PomoSession[]>([]);

  const endTimeRef = useRef<number | null>(init.endTime);
  const startedAtRef = useRef<string | null>(init.startedAt);
  // Guards the one-shot confetti when first crossing zero.
  const enteredOvertimeRef = useRef(init.alarming);

  const totalSeconds = (mode === "work" ? workMin : breakMin) * 60;

  const reloadHistory = useCallback(async () => {
    try {
      const r = await api.get<PomoSession[]>("/pomodoro/sessions/");
      setHistory(Array.isArray(r.data) ? r.data : []);
    } catch {
      /* keep previous history */
    }
  }, []);

  const recordSession = useCallback(async () => {
    try {
      await api.post("/pomodoro/sessions/", {
        task_title: task.summary ?? "",
        calendar_event_id: task.event_id ?? "",
        duration_minutes: workMin,
        started_at: startedAtRef.current ?? new Date().toISOString(),
      });
    } finally {
      startedAtRef.current = null;
      reloadHistory();
    }
  }, [task, workMin, reloadHistory]);

  // Recompute against the wall clock: drives both countdown and overtime, so
  // background-tab throttling never causes drift and overtime keeps growing.
  const evaluate = useCallback(() => {
    if (endTimeRef.current == null) return;
    const diffMs = endTimeRef.current - Date.now();
    if (diffMs > 0) {
      setSecondsLeft(Math.round(diffMs / 1000));
    } else {
      setSecondsLeft(0);
      setOvertime(Math.floor(-diffMs / 1000));
      if (!enteredOvertimeRef.current) {
        enteredOvertimeRef.current = true;
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.4 } });
      }
      setAlarming(true);
    }
  }, []);

  useEffect(() => {
    if (!running) return;
    evaluate();
    const id = window.setInterval(evaluate, 250);
    return () => window.clearInterval(id);
  }, [running, evaluate]);

  // Snap to true time the moment the tab/window regains focus.
  useEffect(() => {
    const sync = () => {
      if (running) evaluate();
    };
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("focus", sync);
    return () => {
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("focus", sync);
    };
  }, [running, evaluate]);

  // Buzz on repeat while alarming, until the user stops it.
  useEffect(() => {
    if (!alarming) return;
    playAlarm();
    const id = window.setInterval(() => playAlarm(), ALARM_REPEAT_MS);
    return () => window.clearInterval(id);
  }, [alarming]);

  // Keep a stopped (and non-alarming) timer in sync with duration changes.
  useEffect(() => {
    if (!running && !alarming) setSecondsLeft(totalSeconds);
  }, [totalSeconds, running, alarming]);

  // Persist on every meaningful change so reloads/tab-close can resume.
  useEffect(() => {
    const snap: Persisted = {
      mode,
      running,
      endTime: endTimeRef.current,
      remaining: secondsLeft,
      workMin,
      breakMin,
      startedAt: startedAtRef.current,
      task,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snap));
  }, [mode, running, alarming, secondsLeft, overtime, workMin, breakMin, task]);

  // Initial load: history + a current-task suggestion if none chosen.
  useEffect(() => {
    reloadHistory();
    if (!task.summary) {
      api
        .get<CurrentTask>("/pomodoro/current-task/")
        .then((r) => {
          setTask(r.data);
          setConnected(true);
        })
        .catch((err: unknown) => {
          const status = (err as { response?: { status?: number } })?.response?.status;
          if (status === 503) setConnected(false);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = useCallback(() => {
    primeAudio(); // unlock audio on this gesture so the alarm sounds later
    const secs = secondsLeft > 0 ? secondsLeft : totalSeconds;
    enteredOvertimeRef.current = false;
    setAlarming(false);
    setOvertime(0);
    endTimeRef.current = Date.now() + secs * 1000;
    if (mode === "work" && !startedAtRef.current) {
      startedAtRef.current = new Date().toISOString();
    }
    setRunning(true);
  }, [secondsLeft, totalSeconds, mode]);

  const pause = useCallback(() => {
    const left =
      endTimeRef.current == null
        ? secondsLeft
        : Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000));
    setSecondsLeft(left);
    endTimeRef.current = null;
    setRunning(false);
  }, [secondsLeft]);

  // Finalize the interval: silence the alarm, record a focus session, advance.
  const stop = useCallback(() => {
    endTimeRef.current = null;
    enteredOvertimeRef.current = false;
    setRunning(false);
    setAlarming(false);
    setOvertime(0);
    if (mode === "work") {
      recordSession();
      setModeState("break");
      setSecondsLeft(breakMin * 60);
    } else {
      setModeState("work");
      setSecondsLeft(workMin * 60);
    }
  }, [mode, breakMin, workMin, recordSession]);

  const reset = useCallback(() => {
    endTimeRef.current = null;
    startedAtRef.current = null;
    enteredOvertimeRef.current = false;
    setRunning(false);
    setAlarming(false);
    setOvertime(0);
    setSecondsLeft(totalSeconds);
  }, [totalSeconds]);

  const setMode = useCallback(
    (m: Mode) => {
      if (running || alarming) return;
      setModeState(m);
    },
    [running, alarming],
  );

  const setWorkMin = useCallback((n: number) => setWorkMinState(Math.max(1, n)), []);
  const setBreakMin = useCallback((n: number) => setBreakMinState(Math.max(1, n)), []);

  const value = useMemo<PomodoroValue>(
    () => ({
      mode,
      running,
      alarming,
      secondsLeft,
      overtime,
      totalSeconds,
      workMin,
      breakMin,
      task,
      connected,
      history,
      start,
      pause,
      stop,
      reset,
      setMode,
      setWorkMin,
      setBreakMin,
      setTask,
      reloadHistory,
    }),
    [
      mode,
      running,
      alarming,
      secondsLeft,
      overtime,
      totalSeconds,
      workMin,
      breakMin,
      task,
      connected,
      history,
      start,
      pause,
      stop,
      reset,
      setMode,
      setWorkMin,
      setBreakMin,
      reloadHistory,
    ],
  );

  return <PomodoroContext.Provider value={value}>{children}</PomodoroContext.Provider>;
}

export function usePomodoro() {
  const ctx = useContext(PomodoroContext);
  if (!ctx) throw new Error("usePomodoro must be used within PomodoroProvider");
  return ctx;
}
