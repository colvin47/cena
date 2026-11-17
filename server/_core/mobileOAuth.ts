import { randomBytes } from "node:crypto";
import { parse as parseCookieHeader } from "cookie";
import type { Express, Request, Response } from "express";
import { decodeOAuthState, encodeOAuthState } from "@shared/const";
import * as db from "../db";
import { sdk } from "./sdk";
import { createMobileOAuthAppCallback, createMobileOAuthErrorCallback, decodeMobileOAuthCookie, isValidMobileOAuthAppState, parseConfiguredMobileOAuthCallbackUris, type MobileOAuthCookiePayload } from "./mobileOAuthUtils";

const MOBILE_STATE_COOKIE = "__Host-cena-mobile-state";
const STATE_COOKIE_MAX_AGE_MS = 10 * 60 * 1000;

function getPublicCallbackUri() {
  const configuredBaseUrl = (process.env.CENA_PUBLIC_BASE_URL || "https://cenacopy-rjglbygs.manus.space").trim();
  const baseUrl = new URL(configuredBaseUrl);
  if (baseUrl.protocol !== "https:" || baseUrl.username || baseUrl.password || baseUrl.pathname !== "/" || baseUrl.search || baseUrl.hash) {
    throw new Error("CENA_PUBLIC_BASE_URL must be an HTTPS origin");
  }
  return new URL("/api/oauth/mobile/callback", baseUrl.origin).toString();
}

function getConfiguredMobileAppCallbackUris() {
  return parseConfiguredMobileOAuthCallbackUris(process.env.CENA_MOBILE_APP_CALLBACK_URIS ?? process.env.CENA_MOBILE_APP_CALLBACK_URI);
}

function queryString(req: Request, key: string) {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

function setAppRedirect(res: Response, callbackUri: string, appState: string, ticket?: string, error?: "cancelled" | "failed") {
  const location = ticket
    ? createMobileOAuthAppCallback(callbackUri, ticket, appState)
    : createMobileOAuthErrorCallback(callbackUri, appState, error || "failed");
  res.redirect(302, location);
}

export function registerMobileOAuthRoutes(app: Express) {
  app.get("/api/oauth/mobile/start", (req: Request, res: Response) => {
    const appState = queryString(req, "state");
    const requestedCallbackUri = queryString(req, "callbackUri");
    const portalUrl = process.env.MANUS_OAUTH_PORTAL_URL;
    const appId = process.env.MANUS_PROJECT_ID;

    let callbackUris: string[];
    let redirectUri: string;
    try {
      callbackUris = getConfiguredMobileAppCallbackUris();
      redirectUri = getPublicCallbackUri();
    } catch {
      res.status(500).json({ error: "Native Manus login is not configured" });
      return;
    }

    if (!isValidMobileOAuthAppState(appState) || !requestedCallbackUri || !callbackUris.includes(requestedCallbackUri) || !portalUrl || !appId) {
      res.status(400).json({ error: "Native Manus login is not configured" });
      return;
    }

    const nonce = randomBytes(32).toString("base64url");
    const cookiePayload: MobileOAuthCookiePayload = { nonce, appState, callbackUri: requestedCallbackUri };
    res.cookie(MOBILE_STATE_COOKIE, Buffer.from(JSON.stringify(cookiePayload)).toString("base64url"), {
      httpOnly: true,
      path: "/",
      maxAge: STATE_COOKIE_MAX_AGE_MS,
      sameSite: "lax",
      secure: true,
    });

    const state = encodeOAuthState({ redirectUri, nonce });
    const loginUrl = new URL("app-auth", `${portalUrl.replace(/\/+$/, "")}/`);
    loginUrl.searchParams.set("appId", appId);
    loginUrl.searchParams.set("redirectUri", redirectUri);
    loginUrl.searchParams.set("state", state);
    loginUrl.searchParams.set("responseType", "code");
    res.redirect(302, loginUrl.toString());
  });

  app.get("/api/oauth/mobile/callback", async (req: Request, res: Response) => {
    const state = queryString(req, "state");
    const code = queryString(req, "code");
    const oauthError = queryString(req, "error");
    const cookieHeader = parseCookieHeader(req.headers.cookie || "");
    const cookiePayload = decodeMobileOAuthCookie(cookieHeader[MOBILE_STATE_COOKIE]);
    const decodedState = state ? decodeOAuthState(state) : { redirectUri: "", nonce: undefined };

    let callbackUris: string[];
    let expectedRedirectUri: string;
    try {
      callbackUris = getConfiguredMobileAppCallbackUris();
      expectedRedirectUri = getPublicCallbackUri();
    } catch {
      res.status(500).send("Login Manus indisponível.");
      return;
    }

    if (!cookiePayload || !callbackUris.includes(cookiePayload.callbackUri) || !state || decodedState.nonce !== cookiePayload.nonce || decodedState.redirectUri !== expectedRedirectUri) {
      res.clearCookie(MOBILE_STATE_COOKIE, { path: "/", secure: true, sameSite: "lax" });
      res.status(400).send("Não foi possível validar o retorno do login.");
      return;
    }
    const callbackUri = cookiePayload.callbackUri;

    res.clearCookie(MOBILE_STATE_COOKIE, { path: "/", secure: true, sameSite: "lax" });
    if (!code) {
      setAppRedirect(res, callbackUri, cookiePayload.appState, undefined, oauthError ? "cancelled" : "failed");
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) throw new Error("Manus identity is missing");

      const ticket = await db.issueMobileOAuthTicket({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
      });
      setAppRedirect(res, callbackUri, cookiePayload.appState, ticket);
    } catch (error) {
      console.error("[Mobile OAuth] Callback failed", error instanceof Error ? error.message : "unknown error");
      setAppRedirect(res, callbackUri, cookiePayload.appState, undefined, "failed");
    }
  });
}
