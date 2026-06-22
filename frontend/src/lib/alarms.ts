// Pomodoro completion alarms, synthesized with the Web Audio API so no audio
// files need bundling. Selection persists in localStorage and is shared between
// the Settings page (preview/cycle) and the Pomodoro timer (playback).

const STORAGE_KEY = "nlc.alarm";

let ctx: AudioContext | null = null;

function audioContext(): AudioContext {
  if (!ctx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    ctx = new Ctor();
  }
  // Browsers suspend the context until a user gesture; resume on demand.
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** Schedule one enveloped tone. `start` is seconds from now. */
function tone(
  ac: AudioContext,
  freq: number,
  start: number,
  dur: number,
  type: OscillatorType = "sine",
  peak = 0.25,
) {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(ac.destination);

  const t = ac.currentTime + start;
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(peak, t + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.start(t);
  osc.stop(t + dur + 0.03);
}

export interface Alarm {
  id: string;
  name: string;
  play: () => void;
}

export const ALARMS: Alarm[] = [
  {
    id: "classic",
    name: "Classic Beep",
    play: () => {
      const ac = audioContext();
      for (let i = 0; i < 3; i++) tone(ac, 880, i * 0.22, 0.16, "square", 0.18);
    },
  },
  {
    id: "chime",
    name: "Soft Chime",
    play: () => {
      const ac = audioContext();
      [523.25, 659.25, 783.99].forEach((f, i) => tone(ac, f, i * 0.16, 0.7, "sine"));
    },
  },
  {
    id: "bell",
    name: "Bell",
    play: () => {
      const ac = audioContext();
      tone(ac, 1318.5, 0, 1.2, "sine", 0.3);
      tone(ac, 2637, 0, 0.8, "sine", 0.08);
      tone(ac, 1318.5, 0.6, 1.0, "sine", 0.2);
    },
  },
  {
    id: "arcade",
    name: "Arcade",
    play: () => {
      const ac = audioContext();
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
        tone(ac, f, i * 0.1, 0.12, "square", 0.16),
      );
    },
  },
  {
    id: "digital",
    name: "Digital Alert",
    play: () => {
      const ac = audioContext();
      for (let i = 0; i < 2; i++) {
        tone(ac, 1200, i * 0.5, 0.1, "sawtooth", 0.14);
        tone(ac, 1200, i * 0.5 + 0.14, 0.1, "sawtooth", 0.14);
      }
    },
  },
];

/**
 * Unlock audio from inside a user gesture (e.g. the Start click). Browsers create
 * an AudioContext suspended and only honor resume() during a gesture, so without
 * this the alarm — fired later by a timer, not a click — stays silent on the
 * focused tab until some unrelated interaction resumes the context.
 */
export function primeAudio() {
  const ac = audioContext();
  if (ac.state === "suspended") void ac.resume();
  // A near-silent blip fully unlocks playback on stricter engines (iOS Safari).
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  gain.gain.value = 0.0001;
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + 0.02);
}

export const DEFAULT_ALARM_ID = ALARMS[0].id;

export function getAlarm(id: string): Alarm {
  return ALARMS.find((a) => a.id === id) ?? ALARMS[0];
}

export function getStoredAlarmId(): string {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored && ALARMS.some((a) => a.id === stored) ? stored : DEFAULT_ALARM_ID;
}

export function setStoredAlarmId(id: string) {
  localStorage.setItem(STORAGE_KEY, id);
}

/** Play an alarm by id (falls back to the default). */
export function playAlarm(id: string = getStoredAlarmId()) {
  getAlarm(id).play();
}
