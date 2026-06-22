import { useMusic } from "../context/MusicContext";

/**
 * Lofi on/off control. Playback itself lives in the persistent
 * <AmbientMusicPlayer/> mounted in Layout, so this toggle can appear anywhere
 * without restarting the music on navigation.
 */
export default function AmbientMusic() {
  const { on, toggle, src } = useMusic();

  return (
    <div className="flex w-full max-w-[340px] flex-col items-center gap-2">
      <button className={on ? "" : "bg-panel-2 text-text"} onClick={toggle}>
        {on ? "♪ Lofi: On" : "♪ Lofi: Off"}
      </button>

      {on && !src && (
        <p className="text-center text-xs text-muted">
          Set a valid YouTube playlist or video URL in Settings.
        </p>
      )}
    </div>
  );
}
