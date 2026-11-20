import type { ArtistDetail, DiscoveryResult, EventTicket, MerchandiseItem, SceneEvent, Track } from "./types";

const configuredBaseUrl = process.env.EXPO_PUBLIC_CENA_API_BASE_URL?.trim();
export const CENA_API_BASE_URL = (configuredBaseUrl || "https://cenaapp-rgtrg8wt.manus.space").replace(/\/+$/, "");
const REQUEST_TIMEOUT_MS = 15_000;
type TrpcEnvelope<T> = { result?: { data?: { json?: T } | T }; error?: { json?: { message?: string }; message?: string } };
export type CenaUser = { id: number; name?: string | null; email?: string | null; accountType?: "listener" | "artist" | null };

function unwrap<T>(envelope: TrpcEnvelope<T>, response: Response) {
  const errorMessage = envelope.error?.json?.message || envelope.error?.message;
  if (!response.ok || errorMessage) throw new Error(errorMessage || `A API do CENA respondeu com HTTP ${response.status}.`);
  const data = envelope.result?.data;
  if (data === undefined) throw new Error("A API do CENA não retornou os dados esperados.");
  return ((typeof data === "object" && data !== null && "json" in data) ? data.json : data) as T;
}

async function queryTrpc<T>(procedure: string, input: Record<string, unknown>, token?: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const encodedInput = encodeURIComponent(JSON.stringify({ json: input }));
    const headers: Record<string, string> = { Accept: "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(`${CENA_API_BASE_URL}/api/trpc/${procedure}?input=${encodedInput}`, { headers, signal: controller.signal });
    const envelope = await response.json() as TrpcEnvelope<T>;
    return unwrap(envelope, response);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw new Error("A conexão com o CENA demorou demais. Tente novamente.");
    if (error instanceof Error) throw error;
    throw new Error("Não foi possível conectar ao CENA.");
  } finally { clearTimeout(timeout); }
}

async function mutateTrpc<T>(procedure: string, input: Record<string, unknown>, token: string): Promise<T> {
  const response = await fetch(`${CENA_API_BASE_URL}/api/trpc/${procedure}`, { method: "POST", headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ json: input }) });
  const envelope = await response.json() as TrpcEnvelope<T>;
  return unwrap(envelope, response);
}

export function absoluteMediaUrl(value?: string | null) { if (!value) return undefined; if (/^https?:\/\//i.test(value)) return value; return `${CENA_API_BASE_URL}/${value.replace(/^\/+/, "")}`; }
export function getDiscovery(input: { city: string; genre?: string; search?: string }) { return queryTrpc<DiscoveryResult>("scene.discovery", { city: input.city, genre: input.genre || "Tudo", search: input.search || "" }).then(result => ({ ...result, tracks: result.tracks.map(track => ({ ...track, _demo: result.source === "seed", handle: track.handle || result.artists.find(artist => artist.id === track.artistId)?.handle })) })); }
export async function getTrackDetail(id: number) { return queryTrpc<Track | null>("scene.trackDetail", { id }); }
export async function getArtistDetail(handle: string) { return queryTrpc<ArtistDetail | null>("scene.artistDetail", { handle }); }
export async function getEventDetail(id: number) { return queryTrpc<SceneEvent | null>("scene.eventDetail", { id }); }
export async function getEventTickets(eventId: number) { return queryTrpc<EventTicket[]>("scene.eventTickets", { eventId }); }
export async function getArtistMerchandise(artistId: number) { return queryTrpc<MerchandiseItem[]>("scene.artistMerchandise", { artistId }); }
export async function getCurrentUser(token: string) { return queryTrpc<CenaUser | null>("auth.me", {}, token); }

export async function exchangeMobileTicket(ticket: string, state: string) {
  const response = await fetch(`${CENA_API_BASE_URL}/api/oauth/mobile/exchange`, { method: "POST", headers: { Accept: "application/json", "Content-Type": "application/json" }, body: JSON.stringify({ ticket, state }) });
  const data = await response.json() as { accessToken?: string; tokenType?: string; expiresIn?: number; user?: CenaUser | null; error?: string };
  if (!response.ok || !data.accessToken) throw new Error(data.error || "Não foi possível concluir o login.");
  return data as { accessToken: string; tokenType: string; expiresIn: number; user: CenaUser | null };
}

export function requestUpload(token: string, input: { kind: "audio" | "image"; fileName: string; contentType: string; size: number }) {
  return mutateTrpc<{ url: string; stableUrl: string }>("scene.requestUpload", input, token);
}

export async function uploadFile(token: string, input: { uri: string; fileName: string; contentType: string; kind: "audio" | "image"; uploadId: string }) {
  const fileResponse = await fetch(input.uri);
  const body = await fileResponse.blob();
  const response = await fetch(`${CENA_API_BASE_URL}/api/upload`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": input.contentType, "x-cena-kind": input.kind, "x-cena-file-name": encodeURIComponent(input.fileName), "x-cena-upload-id": input.uploadId }, body });
  const data = await response.json().catch(() => ({})) as { stableUrl?: string; error?: string };
  if (!response.ok || !data.stableUrl) throw new Error(data.error || "Não foi possível enviar o arquivo.");
  return data.stableUrl;
}

export function createTrack(token: string, input: { title: string; album?: string; genre?: string; city: string; description?: string; releaseType: "single" | "album" | "demo" | "live" | "split" | "compilation"; creditsNote?: string; coverUrl?: string; audioUrl: string; durationSeconds?: number; rightsDeclared: true }) {
  return mutateTrpc<{ persisted: boolean; id: number | null }>("scene.createTrack", input, token);
}
