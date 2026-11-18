import { describe, expect, it } from "vitest";
import { createMobileOAuthAppCallback, createMobileOAuthErrorCallback, decodeMobileOAuthCookie, isValidMobileOAuthAppState, parseConfiguredMobileOAuthCallbackUris, validateMobileOAuthAppCallbackUri } from "./mobileOAuthUtils";

const CALLBACK = "cena://oauth/callback";
const WEBDEV_CALLBACK = "manus025066667759997://oauth/callback";
const APP_STATE = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const TICKET = "0123456789abcdef0123456789abcdef0123456789abc";

describe("protocolo OAuth nativo CENA", () => {
  it("valida state gerado pelo app e rejeita valores curtos ou com caracteres inesperados", () => {
    expect(isValidMobileOAuthAppState(APP_STATE)).toBe(true);
    expect(isValidMobileOAuthAppState("short")).toBe(false);
    expect(isValidMobileOAuthAppState(`${APP_STATE}=`)).toBe(false);
  });

  it("aceita apenas callback scheme fixo e não uma URL externa arbitrária", () => {
    expect(validateMobileOAuthAppCallbackUri(CALLBACK)).toBe(CALLBACK);
    expect(validateMobileOAuthAppCallbackUri("https://attacker.example/callback")).toBeNull();
    expect(validateMobileOAuthAppCallbackUri("cena://attacker.example/callback")).toBeNull();
    expect(validateMobileOAuthAppCallbackUri("cena://oauth/callback?next=https://attacker.example")).toBeNull();
    expect(validateMobileOAuthAppCallbackUri("intent://oauth/callback")).toBeNull();
  });

  it("usa allowlist explícita para compartilhar a API entre os apps CENA e WebDev", () => {
    expect(parseConfiguredMobileOAuthCallbackUris()).toEqual([CALLBACK, WEBDEV_CALLBACK]);
    expect(parseConfiguredMobileOAuthCallbackUris(`${CALLBACK},${WEBDEV_CALLBACK},${CALLBACK}`)).toEqual([CALLBACK, WEBDEV_CALLBACK]);
    expect(() => parseConfiguredMobileOAuthCallbackUris(`${CALLBACK},https://attacker.example/callback`)).toThrow();
  });

  it("decodifica o cookie temporário do navegador sem aceitar payload incompleto", () => {
    const value = Buffer.from(JSON.stringify({ nonce: "nonce-aleatorio", appState: APP_STATE, callbackUri: CALLBACK })).toString("base64url");
    expect(decodeMobileOAuthCookie(value)).toEqual({ nonce: "nonce-aleatorio", appState: APP_STATE, callbackUri: CALLBACK });
    expect(decodeMobileOAuthCookie(Buffer.from(JSON.stringify({ nonce: "x", appState: "short", callbackUri: CALLBACK })).toString("base64url"))).toBeNull();
    expect(decodeMobileOAuthCookie(Buffer.from(JSON.stringify({ nonce: "x", appState: APP_STATE, callbackUri: "intent://oauth/callback" })).toString("base64url"))).toBeNull();
    expect(decodeMobileOAuthCookie("not-json")).toBeNull();
  });

  it("devolve somente ticket opaco e state no callback configurado do app", () => {
    const callback = new URL(createMobileOAuthAppCallback(CALLBACK, TICKET, APP_STATE));
    expect(callback.protocol).toBe("cena:");
    expect(callback.hostname).toBe("oauth");
    expect(callback.pathname).toBe("/callback");
    expect(callback.searchParams.get("ticket")).toBe(TICKET);
    expect(callback.searchParams.get("state")).toBe(APP_STATE);
    expect(callback.searchParams.has("code")).toBe(false);
    expect(callback.searchParams.has("access_token")).toBe(false);
    expect(callback.searchParams.has("sessionToken")).toBe(false);
    expect(() => createMobileOAuthAppCallback(CALLBACK, "short", APP_STATE)).toThrow();
  });

  it("sinaliza cancelamento sem credencial ou ticket", () => {
    const callback = new URL(createMobileOAuthErrorCallback(CALLBACK, APP_STATE, "cancelled"));
    expect(callback.searchParams.get("error")).toBe("cancelled");
    expect(callback.searchParams.has("ticket")).toBe(false);
    expect(() => createMobileOAuthErrorCallback("https://attacker.example/callback", APP_STATE, "failed")).toThrow();
  });
});
