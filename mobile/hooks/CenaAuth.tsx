import * as SecureStore from "expo-secure-store";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Platform } from "react-native";
import { CENA_API_BASE_URL, createCenaApiClient, isInvalidSessionError } from "@/lib/cena-api";

const SESSION_KEY = "cena.auth.session.v1";
const TRANSIENT_SESSION_ERROR = "Não foi possível validar a sessão com a API CENA. Verifique a ligação e tente novamente; a sessão guardada foi preservada.";

export type CenaAuthUser = {
  id: number;
  name: string | null;
  email: string | null;
  accountType: "listener" | "artist";
  role: "user" | "admin";
};

type AccountType = CenaAuthUser["accountType"];
type AuthContextValue = {
  user: CenaAuthUser | null;
  loading: boolean;
  sessionError: string;
  refreshSession: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (input: { name: string; email: string; password: string; accountType: AccountType }) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  logout: () => Promise<void>;
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

export function CenaAuthProvider({ children }: { children: ReactNode }) {
  const sessionToken = useRef<string | null>(null);
  const [user, setUser] = useState<CenaAuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState("");
  const api = useMemo(() => createCenaApiClient(CENA_API_BASE_URL, (input, init) => fetch(input, init), undefined, () => sessionToken.current), []);

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

  const login = async (email: string, password: string) => {
    const result = await api.mutation<{ user: CenaAuthUser; sessionToken?: string }>("auth.loginEmail", { email, password, client: "native" });
    if (!result.sessionToken) throw new Error("A API do CENA não devolveu uma sessão válida.");
    await writeSessionToken(result.sessionToken);
    sessionToken.current = result.sessionToken;
    setUser(result.user);
    setSessionError("");
  };

  const register = async (input: { name: string; email: string; password: string; accountType: AccountType }) => {
    await api.mutation<{ accepted: boolean }>("auth.registerEmail", input);
  };

  const requestPasswordReset = async (email: string) => {
    await api.mutation<{ accepted: boolean }>("auth.requestPasswordReset", { email });
  };

  const logout = async () => {
    try {
      await api.mutation<{ success: boolean }>("auth.logout", {});
    } finally {
      sessionToken.current = null;
      setUser(null);
      setSessionError("");
      await writeSessionToken(null);
    }
  };

  const value = useMemo(() => ({ user, loading, sessionError, refreshSession, login, register, requestPasswordReset, logout }), [user, loading, sessionError, refreshSession]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useCenaAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useCenaAuth precisa de CenaAuthProvider.");
  return context;
}
