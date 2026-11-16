import type { ArtistDetail, DiscoveryResult, EventTicket, MerchandiseItem, SceneEvent, Track } from "./types";
import { validatedApiBaseUrl, validatedMediaUrl } from "./media-urls";

const configuredBaseUrl = process.env.EXPO_PUBLIC_CENA_API_BASE_URL?.trim();
const isDevelopment = typeof __DEV__ !== "undefined" && __DEV__;
export const CENA_API_BASE_URL = validatedApiBaseUrl(configuredBaseUrl, isDevelopment);
const REQUEST_TIMEOUT_MS = 15_000;

type TrpcError = {
  json?: { message?: string; data?: { code?: string } };
  message?: string;
  data?: { code?: string };
};
type TrpcEnvelope<T> = {
  result?: { data?: { json?: T } | T };
  error?: TrpcError;
};
type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
type TrpcMethod = "GET" | "POST";

export class CenaApiError extends Error {
  readonly status: number;
  readonly trpcCode?: string;

  constructor(message: string, status: number, trpcCode?: string) {
    super(message);
    this.name = "CenaApiError";
    this.status = status;
    this.trpcCode = trpcCode;
  }
}

export function isInvalidSessionError(error: unknown) {
  return error instanceof CenaApiError && (error.status === 401 || error.trpcCode === "UNAUTHORIZED");
}

function unwrapEnvelope<T>(response: Response, envelope: TrpcEnvelope<T>) {
  if (!response.ok || envelope.error) {
    const message = envelope.error?.json?.message || envelope.error?.message || (response.ok
      ? "A API do CENA recusou o pedido."
      : `A API do CENA respondeu com HTTP ${response.status}.`);
    const trpcCode = envelope.error?.json?.data?.code || envelope.error?.data?.code;
    throw new CenaApiError(message, response.status, trpcCode);
  }
  const data = envelope.result?.data;
  if (data === undefined) throw new Error("A API do CENA não retornou os dados esperados.");
  return ((typeof data === "object" && data !== null && "json" in data) ? data.json : data) as T;
}

export function createCenaApiClient(baseUrl: string, fetchImpl: FetchLike, timeoutMs = REQUEST_TIMEOUT_MS, getAuthToken?: () => string | null | undefined) {
  const apiBaseUrl = validatedApiBaseUrl(baseUrl, isDevelopment);

  async function call<T>(method: TrpcMethod, procedure: string, input: Record<string, unknown>): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const headers: Record<string, string> = { Accept: "application/json" };
    const authToken = getAuthToken?.();
    if (authToken) headers.Authorization = `Bearer ${authToken}`;
    if (method === "POST") headers["Content-Type"] = "application/json";
    try {
      const inputValue = JSON.stringify({ json: input });
      const url = method === "GET"
        ? `${apiBaseUrl}/api/trpc/${procedure}?input=${encodeURIComponent(inputValue)}`
        : `${apiBaseUrl}/api/trpc/${procedure}`;
      const response = await fetchImpl(url, {
        method,
        headers,
        signal: controller.signal,
        ...(method === "POST" ? { body: inputValue } : {}),
      });
      let envelope: TrpcEnvelope<T>;
      try {
        envelope = await response.json() as TrpcEnvelope<T>;
      } catch {
        throw new Error("O CENA retornou uma resposta inválida.");
      }
      return unwrapEnvelope(response, envelope);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") throw new Error("A conexão com o CENA demorou demais. Tente novamente.");
      if (error instanceof Error) throw error;
      throw new Error("Não foi possível conectar ao CENA.");
    } finally {
      clearTimeout(timeout);
    }
  }

  return {
    query: <T>(procedure: string, input: Record<string, unknown>) => call<T>("GET", procedure, input),
    mutation: <T>(procedure: string, input: Record<string, unknown>) => call<T>("POST", procedure, input),
  };
}

const defaultClient = createCenaApiClient(CENA_API_BASE_URL, (input, init) => fetch(input, init));
function queryTrpc<T>(procedure: string, input: Record<string, unknown>) {
  return defaultClient.query<T>(procedure, input);
}

export function absoluteMediaUrl(value?: string | null) {
  return validatedMediaUrl(value, CENA_API_BASE_URL, isDevelopment);
}

export function getDiscovery(input: { city: string; genre?: string; search?: string }) {
  return queryTrpc<DiscoveryResult>("scene.discovery", { city: input.city, genre: input.genre || "Tudo", search: input.search || "" }).then(result => ({
    ...result,
    tracks: result.tracks.map(track => ({ ...track, _demo: result.source === "seed", handle: track.handle || result.artists.find(artist => artist.id === track.artistId)?.handle })),
  }));
}
export async function getTrackDetail(id: number) {
  return queryTrpc<Track | null>("scene.trackDetail", { id });
}
export async function getArtistDetail(handle: string) {
  return queryTrpc<ArtistDetail | null>("scene.artistDetail", { handle });
}
export async function getEventDetail(id: number) {
  return queryTrpc<SceneEvent | null>("scene.eventDetail", { id });
}
export async function getEventTickets(eventId: number) {
  return queryTrpc<EventTicket[]>("scene.eventTickets", { eventId });
}
export async function getArtistMerchandise(artistId: number) {
  return queryTrpc<MerchandiseItem[]>("scene.artistMerchandise", { artistId });
}
