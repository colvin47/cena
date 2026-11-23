import type { ArtistDetail, CreatorEvent, CreatorMerchandise, CreatorProfile, CreatorStats, CreatorTrack, DiscoveryResult, EventTicket, MerchandiseItem, SceneEvent, Track } from "./types";

const configuredBaseUrl = process.env.EXPO_PUBLIC_CENA_API_BASE_URL?.trim();
export const CENA_API_BASE_URL = (configuredBaseUrl || "https://cenaapp-rgtrg8wt.manus.space").replace(/\/+$/, "");
const REQUEST_TIMEOUT_MS = 15_000;
type TrpcEnvelope<T> = { result?: { data?: { json?: T } | T }; error?: { json?: { message?: string }; message?: string } };
export type CenaUser = { id: number; name?: string | null; email?: string | null; accountType?: "listener" | "artist" | null; city?: string | null; favoriteGenres?: string | null; publicBio?: string | null };

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
  try {
    const response = await fetchWithTimeout(`${CENA_API_BASE_URL}/api/trpc/${procedure}`, { method: "POST", headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ json: input }) });
    const envelope = await response.json() as TrpcEnvelope<T>;
    return unwrap(envelope, response);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw new Error("A conexão com o CENA demorou demais. Tente novamente.");
    throw error;
  }
}

async function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try { return await fetch(input, { ...init, signal: controller.signal }); }
  finally { clearTimeout(timeout); }
}

export function absoluteMediaUrl(value?: string | null) { if (!value) return undefined; if (/^https?:\/\//i.test(value)) return value; return `${CENA_API_BASE_URL}/${value.replace(/^\/+/, "")}`; }
export function getDiscovery(input: { city: string; genre?: string; search?: string }) { return queryTrpc<DiscoveryResult>("scene.discovery", { city: input.city, genre: input.genre || "Tudo", search: input.search || "" }).then(result => ({ ...result, tracks: result.tracks.map(track => ({ ...track, _demo: result.source === "seed", handle: track.handle || result.artists.find(artist => artist.id === track.artistId)?.handle })) })); }
export async function getTrackDetail(id: number) { return queryTrpc<Track | null>("scene.trackDetail", { id }); }
export function recordTrackPlay(trackId: number) { return mutatePublic<{ recorded: boolean }>("scene.recordPlay", { trackId }); }
export async function getArtistDetail(handle: string) { return queryTrpc<ArtistDetail | null>("scene.artistDetail", { handle }); }
export async function getEventDetail(id: number) { return queryTrpc<SceneEvent | null>("scene.eventDetail", { id }); }
export async function getEventTickets(eventId: number) { return queryTrpc<EventTicket[]>("scene.eventTickets", { eventId }); }
export async function getArtistMerchandise(artistId: number) { return queryTrpc<MerchandiseItem[]>("scene.artistMerchandise", { artistId }); }
export async function getCurrentUser(token: string) { return queryTrpc<CenaUser | null>("auth.me", {}, token); }
export type CenaCompliance = { adultVerified: boolean; emailVerified: boolean; email: string | null };
export function getCompliance(token: string) { return queryTrpc<CenaCompliance | null>("auth.compliance", {}, token); }
export function completeCompliance(token: string, dateOfBirth: string) { return mutateTrpc<{ persisted: boolean; adultVerified: boolean }>("auth.completeCompliance", { dateOfBirth }, token); }
export function updateListenerProfile(token: string, input: { city: string; favoriteGenres?: string; publicBio?: string }) { return mutateTrpc<{ persisted: boolean }>("auth.updateListenerProfile", input, token); }

async function mutatePublic<T>(procedure: string, input: Record<string, unknown>): Promise<T> {
  try {
    const response = await fetchWithTimeout(`${CENA_API_BASE_URL}/api/trpc/${procedure}`, { method: "POST", headers: { Accept: "application/json", "Content-Type": "application/json" }, body: JSON.stringify({ json: input }) });
    const envelope = await response.json() as TrpcEnvelope<T>;
    return unwrap(envelope, response);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw new Error("A conexão com o CENA demorou demais. Tente novamente.");
    throw error;
  }
}

export async function exchangeMobileTicket(ticket: string, state: string) {
  try {
    const response = await fetchWithTimeout(`${CENA_API_BASE_URL}/api/oauth/mobile/exchange`, { method: "POST", headers: { Accept: "application/json", "Content-Type": "application/json" }, body: JSON.stringify({ ticket, state }) });
    const data = await response.json() as { accessToken?: string; tokenType?: string; expiresIn?: number; user?: CenaUser | null; error?: string };
    if (!response.ok || !data.accessToken) throw new Error(data.error || "Não foi possível concluir o login.");
    return data as { accessToken: string; tokenType: string; expiresIn: number; user: CenaUser | null };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw new Error("O login demorou demais. Tente novamente.");
    throw error;
  }
}

export function requestUpload(token: string, input: { kind: "audio" | "image"; fileName: string; contentType: string; size: number }) {
  return mutateTrpc<{ url: string; stableUrl: string }>("scene.requestUpload", input, token);
}

export async function uploadFile(token: string, input: { uri: string; fileName: string; contentType: string; kind: "audio" | "image"; uploadId: string }) {
  const fileResponse = await fetchWithTimeout(input.uri);
  if (!fileResponse.ok) throw new Error("Não foi possível ler o arquivo selecionado.");
  const body = await fileResponse.blob();
  try {
    const response = await fetchWithTimeout(`${CENA_API_BASE_URL}/api/upload`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": input.contentType, "x-cena-kind": input.kind, "x-cena-file-name": encodeURIComponent(input.fileName), "x-cena-upload-id": input.uploadId }, body });
    const data = await response.json().catch(() => ({})) as { stableUrl?: string; error?: string };
    if (!response.ok || !data.stableUrl) throw new Error(data.error || "Não foi possível enviar o arquivo.");
    return data.stableUrl;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw new Error("O envio demorou demais. Tente novamente.");
    throw error;
  }
}

export function createTrack(token: string, input: { title: string; album?: string; genre?: string; city: string; description?: string; releaseType: "single" | "album" | "demo" | "live" | "split" | "compilation"; creditsNote?: string; lyrics?: string; coverUrl?: string; audioUrl: string; durationSeconds?: number; rightsDeclared: true }) {
  return mutateTrpc<{ persisted: boolean; id: number | null }>("scene.createTrack", input, token);
}

export function getCreatorProfile(token: string) { return queryTrpc<CreatorProfile | null>("scene.myArtistProfile", {}, token); }
export function getCreatorStats(token: string) { return queryTrpc<CreatorStats | null>("scene.artistStats", {}, token); }
export function getCreatorEvents(token: string) { return queryTrpc<CreatorEvent[]>("scene.myEvents", {}, token); }
export function getCreatorTracks(token: string) { return queryTrpc<CreatorTrack[]>("scene.myTracks", {}, token); }
export function getCreatorMerchandise(token: string) { return queryTrpc<CreatorMerchandise[]>("scene.myMerchandise", {}, token); }
export function createArtistProfile(token: string, input: { name: string; handle: string; city: string; profileType?: string; genre?: string; bio?: string; manifesto?: string; supportUrl?: string; pixUrl?: string; merchUrl?: string }) { return mutateTrpc<{ persisted: boolean; profile: CreatorProfile | null }>("scene.createArtistProfile", input, token); }
export function updateCreatorProfile(token: string, input: { name: string; handle: string; city: string; profileType?: string; genre?: string; bio?: string; manifesto?: string; instagramUrl?: string; bandcampUrl?: string; supportUrl?: string; pixUrl?: string; merchUrl?: string }) { return mutateTrpc<{ persisted: boolean; profile: CreatorProfile }>("scene.updateArtistProfile", input, token); }
export type CreatorEventInput = { id?: number; name: string; venue: string; city: string; eventDate: string; eventType?: string; admissionType?: string; description?: string; program?: string; accessibility?: string; safeSpace?: boolean; ageRating?: string; ticketUrl?: string };
export function createCreatorEvent(token: string, input: Omit<CreatorEventInput, "id">) { return mutateTrpc<{ persisted: boolean; id: number }>("scene.createEvent", input, token); }
export function updateCreatorEvent(token: string, input: CreatorEventInput & { id: number }) { return mutateTrpc<{ persisted: boolean; event: CreatorEvent }>("scene.updateEvent", input, token); }
export function createMerchandise(token: string, input: { title: string; description?: string; price: string; stock: number; externalUrl?: string }) { return mutateTrpc<{ persisted: boolean; item: CreatorMerchandise }>("scene.createMerchandise", input, token); }
export function updateMerchandise(token: string, input: { id: number; title: string; description?: string; price: string; stock: number; externalUrl?: string }) { return mutateTrpc<{ persisted: boolean; item: CreatorMerchandise }>("scene.updateMerchandise", input, token); }
export function deleteMerchandise(token: string, id: number) { return mutateTrpc<{ deleted: boolean }>("scene.deleteMerchandise", { id }, token); }
