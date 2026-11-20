import * as Linking from "expo-linking";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { CENA_API_BASE_URL, exchangeMobileTicket, getCurrentUser, type CenaUser } from "@/lib/cena-api";

WebBrowser.maybeCompleteAuthSession();
const TOKEN_KEY = "cena.mobile.session";
const CALLBACK_URI = "cena://oauth/callback";

type AuthContextValue = { token: string | null; user: CenaUser | null; loading: boolean; signIn: () => Promise<void>; signOut: () => Promise<void>; refresh: () => Promise<void> };
const AuthContext = createContext<AuthContextValue | null>(null);

function makeState() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

export function CenaAuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<CenaUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const saved = await SecureStore.getItemAsync(TOKEN_KEY);
    if (!saved) { setToken(null); setUser(null); return; }
    try { const current = await getCurrentUser(saved); setToken(saved); setUser(current); }
    catch { await SecureStore.deleteItemAsync(TOKEN_KEY); setToken(null); setUser(null); }
  };

  useEffect(() => { void refresh().finally(() => setLoading(false)); }, []);

  const signIn = async () => {
    const state = makeState();
    const startUrl = `${CENA_API_BASE_URL}/api/oauth/mobile/start?state=${encodeURIComponent(state)}&redirectUri=${encodeURIComponent(CALLBACK_URI)}`;
    const result = await WebBrowser.openAuthSessionAsync(startUrl, CALLBACK_URI);
    if (result.type !== "success" || !result.url) throw new Error("O login foi cancelado ou não retornou ao CENA.");
    const parsed = Linking.parse(result.url);
    const ticket = typeof parsed.queryParams?.ticket === "string" ? parsed.queryParams.ticket : "";
    const returnedState = typeof parsed.queryParams?.state === "string" ? parsed.queryParams.state : "";
    if (!ticket || returnedState !== state) throw new Error("Resposta de login inválida.");
    const exchanged = await exchangeMobileTicket(ticket, returnedState);
    await SecureStore.setItemAsync(TOKEN_KEY, exchanged.accessToken);
    setToken(exchanged.accessToken);
    setUser(exchanged.user);
  };

  const signOut = async () => { await SecureStore.deleteItemAsync(TOKEN_KEY); setToken(null); setUser(null); };
  const value = useMemo(() => ({ token, user, loading, signIn, signOut, refresh }), [token, user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useCenaAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useCenaAuth must be used inside CenaAuthProvider");
  return context;
}
