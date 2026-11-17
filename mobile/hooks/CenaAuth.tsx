import * as Crypto from "expo-crypto";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Platform } from "react-native";
import { CENA_API_BASE_URL, createCenaApiClient, isInvalidSessionError } from "@/lib/cena-api";
import { uploadCenaFile, type LocalCenaFile } from "@/lib/cena-upload";
import type { CenaUploadKind } from "@/lib/upload-policy";

WebBrowser.maybeCompleteAuthSession();

const SESSION_KEY = "cena.auth.session.v1";
const TRANSIENT_SESSION_ERROR = "Não foi possível validar a sessão com a API CENA. Verifique a ligação e tente novamente; a sessão guardada foi preservada.";

export type CenaAuthUser = {
  id: number;
  name: string | null;
  email: string | null;
  accountType: "listener" | "artist";
  role: "user" | "admin";
};

export type CenaApiQuery = <T>(procedure: string, input: Record<string, unknown>) => Promise<T>;
export type CenaApiMutation = <T>(procedure: string, input: Record<string, unknown>) => Promise<T>;

type AccountType = CenaAuthUser["accountType"];
type AuthContextValue = {
  user: CenaAuthUser | null;
  loading: boolean;
  sessionError: string;
  refreshSession: () => Promise<void>;
  loginWithManus: () => Promise<void>;
  logout: () => Promise<void>;
  setAccountType: (accountType: AccountType) => Promise<void>;
  query: CenaApiQuery;
  mutation: CenaApiMutation;
  uploadFile: (asset: LocalCenaFile, kind: CenaUploadKind, uploadKey: string) => Promise<string>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function readSessionToken() {
  try {
    if (Platform.OS === "web") return typeof sessionStorage === "undefined" ? null : sessionStorage.getItem(SESSION_KEY);
    return await SecureStore.getItemAsync(SESSION_KEY);
  } catch {
    return null;
  }
}

async function writeSessionToken(token: string | null) {
  try {
    if (Platform.OS === "web") {
      if (typeof sessionStorage === "undefined") return;
      if (token) sessionStorage.setItem(SESSION_KEY, token);
      else sessionStorage.removeItem(SESSION_KEY);
      return;
    }
    if (token) await SecureStore.setItemAsync(SESSION_KEY, token, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
    else await SecureStore.deleteItemAsync(SESSION_KEY);
  } catch {
    if (token) throw new Error("Não foi possível guardar a sessão protegida neste aparelho.");
  }
}

async function randomAppState() {
  const bytes = await Crypto.getRandomBytesAsync(32);
  return Array.from(bytes, value => value.toString(16).padStart(2, "0")).join("");
}

function getMobileCallbackUri() {
  const configuredScheme = Constants.expoConfig?.scheme;
  const scheme = Array.isArray(configuredScheme) ? configuredScheme[0] : configuredScheme;
  if (typeof scheme !== "string" || !/^[A-Za-z][A-Za-z0-9+.-]*$/.test(scheme)) throw new Error("O scheme de retorno do app não está configurado.");
  return `${scheme}://oauth/callback`;
}

function isMobileOAuthCallback(url: URL, callbackUri: string) {
  const expected = new URL(callbackUri);
  return url.protocol === expected.protocol && url.hostname === expected.hostname && url.pathname === expected.pathname;
}

export function CenaAuthProvider({ children }: { children: ReactNode }) {
  const sessionToken = useRef<string | null>(null);
  const [user, setUser] = useState<CenaAuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState("");
  const api = useMemo(() => createCenaApiClient(CENA_API_BASE_URL, (input, init) => fetch(input, init), undefined, () => sessionToken.current), []);

  const query = useCallback(function query<T>(procedure: string, input: Record<string, unknown>) {
    return api.query<T>(procedure, input);
  }, [api]);
  const mutation = useCallback(function mutation<T>(procedure: string, input: Record<string, unknown>) {
    return api.mutation<T>(procedure, input);
  }, [api]);

  const validateStoredSession = useCallback(async (isActive: () => boolean = () => true) => {
    const stored = await readSessionToken();
    if (!isActive()) return;
    sessionToken.current = stored;
    if (!stored) {
      setUser(null);
      setSessionError("");
      return;
    }

    try {
      const currentUser = await api.query<CenaAuthUser | null>("auth.me", {});
      if (!isActive()) return;
      if (currentUser) {
        setUser(currentUser);
        setSessionError("");
        return;
      }

      sessionToken.current = null;
      setUser(null);
      setSessionError("");
      await writeSessionToken(null);
    } catch (error) {
      if (!isActive()) return;
      if (isInvalidSessionError(error)) {
        sessionToken.current = null;
        setUser(null);
        setSessionError("");
        await writeSessionToken(null);
        return;
      }
      setSessionError(TRANSIENT_SESSION_ERROR);
    }
  }, [api]);

  const refreshSession = useCallback(async () => {
    setSessionError("");
    await validateStoredSession();
  }, [validateStoredSession]);

  useEffect(() => {
    let active = true;
    void validateStoredSession(() => active).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [validateStoredSession]);

  const loginWithManus = useCallback(async () => {
    if (Platform.OS === "web") throw new Error("Entre com Manus pelo app Android instalado.");

    const appState = await randomAppState();
    const callbackUri = getMobileCallbackUri();
    const startUrl = new URL("/api/oauth/mobile/start", CENA_API_BASE_URL);
    startUrl.searchParams.set("state", appState);
    startUrl.searchParams.set("callbackUri", callbackUri);
    const result = await WebBrowser.openAuthSessionAsync(startUrl.toString(), callbackUri);
    if (result.type !== "success" || !result.url) throw new Error("Login Manus cancelado.");

    let callback: URL;
    try {
      callback = new URL(result.url);
    } catch {
      throw new Error("O retorno do login Manus não é válido.");
    }
    if (!isMobileOAuthCallback(callback, callbackUri) || callback.searchParams.get("state") !== appState) {
      throw new Error("Não foi possível validar o retorno do login Manus. Tente novamente.");
    }
    if (callback.searchParams.get("error")) {
      throw new Error(callback.searchParams.get("error") === "cancelled" ? "Login Manus cancelado." : "Não foi possível entrar com Manus. Tente novamente.");
    }

    const ticket = callback.searchParams.get("ticket");
    if (!ticket || !/^[A-Za-z0-9_-]{40,64}$/.test(ticket)) throw new Error("O servidor CENA não devolveu um ticket de login válido.");

    sessionToken.current = null;
    try {
      const exchanged = await api.mutation<{ sessionToken: string }>("auth.exchangeMobileOAuthTicket", { ticket });
      if (!exchanged.sessionToken) throw new Error("A API CENA não devolveu uma sessão válida.");
      sessionToken.current = exchanged.sessionToken;
      const currentUser = await api.query<CenaAuthUser | null>("auth.me", {});
      if (!currentUser) throw new Error("A sessão recebida não foi validada pela API CENA.");
      await writeSessionToken(exchanged.sessionToken);
      setUser(currentUser);
      setSessionError("");
    } catch (error) {
      sessionToken.current = null;
      await writeSessionToken(null);
      throw error;
    }
  }, [api]);

  const setAccountType = useCallback(async (accountType: AccountType) => {
    if (!user) throw new Error("Entre com Manus antes de alterar o perfil.");
    const result = await api.mutation<{ accountType: AccountType; persisted: boolean }>("scene.setAccountType", { accountType });
    if (!result.persisted) throw new Error("Não foi possível salvar o tipo de perfil na API CENA.");
    setUser(previous => previous ? { ...previous, accountType: result.accountType } : previous);
  }, [api, user]);

  const uploadFile = useCallback(async (asset: LocalCenaFile, kind: CenaUploadKind, uploadKey: string) => {
    const token = sessionToken.current;
    if (!user || !token) throw new Error("Entre com Manus antes de enviar arquivos.");
    if (user.accountType !== "artist" && user.role !== "admin") throw new Error("Ative o perfil de artista antes de enviar arquivos.");
    return uploadCenaFile(asset, kind, token, uploadKey);
  }, [user]);

  const logout = useCallback(async () => {
    try {
      await api.mutation<{ success: boolean }>("auth.logout", {});
    } finally {
      sessionToken.current = null;
      setUser(null);
      setSessionError("");
      await writeSessionToken(null);
    }
  }, [api]);

  const value = useMemo(() => ({ user, loading, sessionError, refreshSession, loginWithManus, logout, setAccountType, query, mutation, uploadFile }), [user, loading, sessionError, refreshSession, loginWithManus, logout, setAccountType, query, mutation, uploadFile]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useCenaAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useCenaAuth precisa de CenaAuthProvider.");
  return context;
}
