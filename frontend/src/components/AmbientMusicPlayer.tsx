import { useMusic } from "../context/MusicContext";

/**
 * The actual lofi iframe. Mounted once in Layout, outside the routed Outlet, so
 * playback continues uninterrupted as the user moves between pages. Shown as a
 * small floating bar that doubles as in-player (YouTube) controls.
 */
export default function AmbientMusicPlayer() {
  const { on, src } = useMusic();
  if (!on || !src) return null;

  return (
    <div className="fixed bottom-3 right-3 z-40 w-[280px] overflow-hidden rounded-xl border border-border shadow-lg">
      <iframe
        title="Lofi ambient music"
        width="100%"
        height="80"
        src={src}
        allow="autoplay; encrypted-media"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}
