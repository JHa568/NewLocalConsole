import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { buildEmbedSrc, getStoredSource } from "../lib/music";

const STORAGE_KEY = "nlc.lofi";

interface MusicValue {
  on: boolean;
  toggle: () => void;
  setOn: (v: boolean) => void;
  /** Embed URL, or null when the stored source is unparseable. */
  src: string | null;
}

const MusicContext = createContext<MusicValue | null>(null);

/**
 * App-level lofi state. Lives above the routed pages so the player keeps playing
 * across navigation; the toggle and the iframe both read from here.
 */
export function MusicProvider({ children }: { children: React.ReactNode }) {
  const [on, setOn] = useState(() => localStorage.getItem(STORAGE_KEY) === "on");
  // Recomputed each render (cheap), so toggling on picks up a source edited on
  // the Settings page without a full reload.
  const src = buildEmbedSrc(getStoredSource());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
  }, [on]);

  const value = useMemo<MusicValue>(
    () => ({ on, toggle: () => setOn((v) => !v), setOn, src }),
    [on, src],
  );

  return <MusicContext.Provider value={value}>{children}</MusicContext.Provider>;
}

export function useMusic() {
  const ctx = useContext(MusicContext);
  if (!ctx) throw new Error("useMusic must be used within MusicProvider");
  return ctx;
}
