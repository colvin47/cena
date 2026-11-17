const APP_STATE_PATTERN = /^[A-Za-z0-9_-]{32,128}$/;

export type MobileOAuthCookiePayload = { nonce: string; appState: string; callbackUri: string };

export function parseConfiguredMobileOAuthCallbackUris(value?: string): string[] {
  const candidates = value === undefined ? ["cena://oauth/callback"] : value.split(",").map(uri => uri.trim());
  if (candidates.length === 0 || candidates.some(uri => !uri)) throw new Error("At least one mobile callback URI is required");
  const callbacks = candidates.map(uri => {
    const callback = validateMobileOAuthAppCallbackUri(uri);
    if (!callback || callback !== uri) throw new Error("Invalid mobile callback URI configuration");
    return callback;
  });
  return [...new Set(callbacks)];
}

export function isValidMobileOAuthAppState(value: unknown): value is string {
  return typeof value === "string" && APP_STATE_PATTERN.test(value);
}

export function validateMobileOAuthAppCallbackUri(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const callback = new URL(value);
    if (!/^(?:cena|manus[0-9]+):$/.test(callback.protocol)) return null;
    if (callback.hostname !== "oauth" || callback.pathname !== "/callback" || callback.username || callback.password || callback.search || callback.hash) return null;
    return callback.toString();
  } catch {
    return null;
  }
}

export function decodeMobileOAuthCookie(value: string | undefined): MobileOAuthCookiePayload | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Partial<MobileOAuthCookiePayload>;
    if (typeof parsed.nonce !== "string" || !isValidMobileOAuthAppState(parsed.appState)) return null;
    const callbackUri = validateMobileOAuthAppCallbackUri(parsed.callbackUri);
    if (!callbackUri || callbackUri !== parsed.callbackUri) return null;
    return { nonce: parsed.nonce, appState: parsed.appState, callbackUri };
  } catch {
    return null;
  }
}

export function createMobileOAuthAppCallback(callbackUri: string, ticket: string, appState: string) {
  const validatedCallbackUri = validateMobileOAuthAppCallbackUri(callbackUri);
  if (!validatedCallbackUri || validatedCallbackUri !== callbackUri || !/^[A-Za-z0-9_-]{40,64}$/.test(ticket) || !isValidMobileOAuthAppState(appState)) {
    throw new Error("Invalid mobile OAuth callback data");
  }
  const callback = new URL(validatedCallbackUri);
  callback.searchParams.set("ticket", ticket);
  callback.searchParams.set("state", appState);
  return callback.toString();
}

export function createMobileOAuthErrorCallback(callbackUri: string, appState: string, error: "cancelled" | "failed") {
  const validatedCallbackUri = validateMobileOAuthAppCallbackUri(callbackUri);
  if (!validatedCallbackUri || validatedCallbackUri !== callbackUri || !isValidMobileOAuthAppState(appState)) throw new Error("Invalid mobile OAuth state");
  const callback = new URL(validatedCallbackUri);
  callback.searchParams.set("state", appState);
  callback.searchParams.set("error", error);
  return callback.toString();
}
