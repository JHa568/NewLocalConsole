import { useState } from "react";
import Card from "../../components/ui/Card";
import SectionLabel from "../../components/ui/SectionLabel";
import { buildEmbedSrc, DEFAULT_SOURCE, getStoredSource, setStoredSource } from "../../lib/music";

/** Configure the ambient lofi source used on the Pomodoro page. */
export default function MusicCard() {
  const [musicSrc, setMusicSrc] = useState(getStoredSource);
  const [musicSaved, setMusicSaved] = useState(false);
  const musicValid = buildEmbedSrc(musicSrc) !== null;

  function saveMusic(e: React.FormEvent) {
    e.preventDefault();
    setStoredSource(musicSrc);
    setMusicSaved(true);
  }

  function resetMusic() {
    setMusicSrc(DEFAULT_SOURCE);
    setStoredSource(DEFAULT_SOURCE);
    setMusicSaved(true);
  }

  return (
    <Card className="lg:col-span-2">
      <SectionLabel>Lofi music</SectionLabel>
      <p className="mt-1.5 mb-4 text-sm text-muted">
        YouTube playlist or video URL played as ambient music on the Pomodoro page. Avoid live
        streams — YouTube blocks embedding them.
      </p>
      <form className="flex flex-wrap items-end gap-3" onSubmit={saveMusic}>
        <label className="my-0 min-w-[220px] flex-1">
          YouTube URL
          <input
            value={musicSrc}
            onChange={(e) => {
              setMusicSrc(e.target.value);
              setMusicSaved(false);
            }}
            placeholder="https://www.youtube.com/playlist?list=…"
          />
        </label>
        <button type="submit" disabled={!musicValid}>
          Save
        </button>
        <button type="button" className="bg-panel-2 text-text" onClick={resetMusic}>
          Default
        </button>
      </form>
      {!musicValid && musicSrc.trim() !== "" && (
        <p className="mt-2 text-xs text-bad">Not a recognised YouTube URL or ID.</p>
      )}
      {musicSaved && musicValid && (
        <p className="mt-2 text-xs text-good">Saved — toggle Lofi on the Pomodoro page.</p>
      )}
    </Card>
  );
}
