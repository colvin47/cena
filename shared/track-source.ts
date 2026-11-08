export type TrackSourceType = "upload" | "spotify" | "youtube" | "bandcamp" | "soundcloud";

export type ExternalTrackSource = {
  sourceType: Exclude<TrackSourceType, "upload">;
  externalUrl: string;
  embedUrl: string | null;
  label: string;
};

const labels: Record<ExternalTrackSource["sourceType"], string> = {
  spotify: "Spotify",
  youtube: "YouTube",
  bandcamp: "Bandcamp",
  soundcloud: "SoundCloud",
};

function youtubeId(url: URL) {
  if (url.hostname === "youtu.be") return url.pathname.slice(1).split("/")[0] || null;
  if (url.pathname.startsWith("/embed/") || url.pathname.startsWith("/shorts/")) return url.pathname.split("/")[2] || null;
  return url.searchParams.get("v");
}

export function parseExternalTrackUrl(raw: string): ExternalTrackSource | null {
  try {
    const url = new URL(raw.trim());
    const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    const normalized = url.toString();

    if (hostname === "open.spotify.com" && url.pathname.startsWith("/track/")) {
      const id = url.pathname.split("/")[2];
      if (!id) return null;
      return { sourceType: "spotify", externalUrl: normalized, embedUrl: `https://open.spotify.com/embed/track/${encodeURIComponent(id)}?utm_source=generator&theme=0`, label: labels.spotify };
    }

    if (hostname === "youtube.com" || hostname === "m.youtube.com" || hostname === "youtu.be") {
      const id = youtubeId(url);
      if (!id) return null;
      return { sourceType: "youtube", externalUrl: normalized, embedUrl: `https://www.youtube.com/embed/${encodeURIComponent(id)}?rel=0`, label: labels.youtube };
    }

    if (hostname === "soundcloud.com" && url.pathname.split("/").filter(Boolean).length >= 2) {
      return { sourceType: "soundcloud", externalUrl: normalized, embedUrl: `https://w.soundcloud.com/player/?url=${encodeURIComponent(normalized)}&color=%23c8f36a&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&visual=false`, label: labels.soundcloud };
    }

    if (hostname.endsWith(".bandcamp.com")) {
      return { sourceType: "bandcamp", externalUrl: normalized, embedUrl: null, label: labels.bandcamp };
    }
  } catch {
    return null;
  }
  return null;
}
