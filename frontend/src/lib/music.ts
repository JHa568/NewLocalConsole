// Ambient lofi source config. The user can paste any YouTube playlist or video
// URL/ID in Settings; it persists in localStorage and is read by AmbientMusic.
// Default is a real lofi *playlist* (cycles tracks). Live-stream URLs are avoided
// because YouTube commonly blocks embedding them.

const STORAGE_KEY = "nlc.lofi.src";

// "LoFi Study Music" playlist — embeddable, continuously cycling.
export const DEFAULT_SOURCE =
  "https://www.youtube.com/playlist?list=PLoFqog36C2E0yMWv3eVUd673K_A7FVoIG";

export interface MusicSource {
  kind: "playlist" | "video";
  id: string;
}

/** Parse a YouTube URL or bare id into a playlist/video source. */
export function parseYouTube(input: string): MusicSource | null {
  const s = input.trim();
  if (!s) return null;

  try {
    const u = new URL(s.includes("://") ? s : `https://${s}`);
    const list = u.searchParams.get("list");
    if (list) return { kind: "playlist", id: list };
    const v = u.searchParams.get("v");
    if (v) return { kind: "video", id: v };
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.slice(1);
      if (id) return { kind: "video", id };
    }
    const embed = u.pathname.match(/\/embed\/([^/?]+)/);
    if (embed) return { kind: "video", id: embed[1] };
  } catch {
    // not a URL — fall through to bare-id checks
  }

  if (/^(PL|OL|UU|RD|FL|LL)[\w-]+$/.test(s)) return { kind: "playlist", id: s };
  if (/^[\w-]{11}$/.test(s)) return { kind: "video", id: s };
  return null;
}

/** Build an autoplaying, looping embed URL, or null if unparseable. */
export function buildEmbedSrc(input: string): string | null {
  const parsed = parseYouTube(input);
  if (!parsed) return null;
  const base = "https://www.youtube.com/embed";
  if (parsed.kind === "playlist") {
    return `${base}/videoseries?list=${parsed.id}&autoplay=1&loop=1`;
  }
  // Single-video loop needs the id repeated in the playlist param.
  return `${base}/${parsed.id}?autoplay=1&loop=1&playlist=${parsed.id}`;
}

export function getStoredSource(): string {
  return localStorage.getItem(STORAGE_KEY) || DEFAULT_SOURCE;
}

export function setStoredSource(s: string) {
  if (s.trim()) localStorage.setItem(STORAGE_KEY, s.trim());
  else localStorage.removeItem(STORAGE_KEY);
}
