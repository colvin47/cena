import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "@/components/Screen";
import { theme } from "@/components/theme";
import { useCenaAuth } from "@/hooks/CenaAuth";

export default function AccountScreen() {
  const router = useRouter();
  const { user, loading, sessionError, refreshSession, loginWithManus, logout } = useCenaAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setBusy(true);
    setError("");
    try {
      await loginWithManus();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Não foi possível entrar com Manus. Tente novamente.");
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    setBusy(true);
    setError("");
    try {
      await logout();
    } catch (logoutError) {
      setError(logoutError instanceof Error ? logoutError.message : "Não foi possível terminar a sessão local.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <Screen><View style={styles.header}><Text style={styles.eyebrow}>CENA · CONTA</Text><Text style={styles.title}>A validar a sessão…</Text></View></Screen>;
  }

  if (user) {
    return (
      <Screen>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>CENA · CONTA</Text>
          <Text style={styles.title}>A sua presença.</Text>
          <Text style={styles.subtitle}>O login é feito com Manus. A sessão do CENA fica guardada com segurança neste aparelho.</Text>
        </View>

        <View style={styles.accountCard}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{(user.name || user.email || "C").slice(0, 1).toUpperCase()}</Text></View>
          <View style={styles.accountInfo}>
            <Text style={styles.accountName}>{user.name || "Conta CENA"}</Text>
            {user.email ? <Text style={styles.accountEmail}>{user.email}</Text> : null}
            <Text style={styles.accountType}>{user.accountType === "artist" ? "ARTISTA / BANDA" : "OUVINTE"}</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Quer publicar uma faixa?</Text>
          <Text style={styles.note}>No app, você pode ativar o perfil artístico, criar o perfil e enviar áudio e capa. Só serão enviados depois de tocar em Publicar.</Text>
          <Pressable accessibilityRole="button" onPress={() => router.push("/upload")} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Abrir envio de música</Text>
          </Pressable>
        </View>

        <Text style={styles.note}>A biblioteca pessoal e os favoritos continuam guardados apenas neste aparelho.</Text>
        {sessionError ? <Text accessibilityRole="alert" style={styles.error}>{sessionError}</Text> : null}
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        <Pressable accessibilityRole="button" disabled={busy} style={styles.secondaryButton} onPress={() => void handleLogout()}>
          <Text style={styles.secondaryButtonText}>{busy ? "A terminar sessão…" : "Terminar sessão"}</Text>
        </Pressable>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>CENA · CONTA</Text>
        <Text style={styles.title}>Entre na sua cena.</Text>
        <Text style={styles.subtitle}>Por enquanto, o app usa o login Manus. Depois de validar a sessão CENA, você pode publicar faixas com seu perfil artístico.</Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Login seguro</Text>
        <Text style={styles.note}>A autenticação abre o navegador do Android. O app recebe um ticket curto de uso único; a sessão é validada pela API CENA e guardada no armazenamento seguro do aparelho.</Text>
        <Pressable accessibilityRole="button" disabled={busy} onPress={() => void handleLogin()} style={[styles.primaryButton, busy && styles.disabled]}>
          <Text style={styles.primaryButtonText}>{busy ? "A abrir o login Manus…" : "Entrar com Manus"}</Text>
        </Pressable>
      </View>

      {sessionError ? (
        <View style={styles.statusCard}>
          <Text accessibilityRole="alert" style={styles.error}>{sessionError}</Text>
          <Pressable accessibilityRole="button" disabled={busy} onPress={() => { setBusy(true); void refreshSession().finally(() => setBusy(false)); }} style={styles.textLink}>
            <Text style={styles.linkText}>{busy ? "A validar…" : "Tentar validar sessão novamente"}</Text>
          </Pressable>
        </View>
      ) : null}
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      <Text style={styles.footerNote}>O login CENA por e-mail ainda não está disponível. A biblioteca local não é enviada ao servidor.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: 8 },
  eyebrow: { color: theme.coral, fontSize: 9, fontWeight: "900", letterSpacing: 1.5 },
  title: { color: theme.text, fontSize: 29, fontWeight: "900", letterSpacing: -0.7 },
  subtitle: { color: theme.muted, fontSize: 12, lineHeight: 18 },
  infoCard: { gap: 12, padding: 15, borderRadius: 15, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.surface },
  infoTitle: { color: theme.text, fontSize: 15, fontWeight: "900" },
  note: { color: theme.muted, fontSize: 11, lineHeight: 17 },
  primaryButton: { minHeight: 48, justifyContent: "center", alignItems: "center", paddingHorizontal: 16, borderRadius: 12, backgroundColor: theme.lime },
  primaryButtonText: { color: theme.background, fontSize: 13, fontWeight: "900" },
  disabled: { opacity: 0.55 },
  accountCard: { flexDirection: "row", alignItems: "center", gap: 13, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.line, borderRadius: 15, padding: 15 },
  avatar: { width: 48, height: 48, alignItems: "center", justifyContent: "center", borderRadius: 24, backgroundColor: theme.lime },
  avatarText: { color: theme.background, fontSize: 20, fontWeight: "900" },
  accountInfo: { flex: 1, gap: 3 },
  accountName: { color: theme.text, fontSize: 15, fontWeight: "900" },
  accountEmail: { color: theme.muted, fontSize: 11 },
  accountType: { color: theme.lavender, fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  secondaryButton: { minHeight: 46, justifyContent: "center", alignItems: "center", borderRadius: 12, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.surfaceRaised },
  secondaryButtonText: { color: theme.text, fontSize: 12, fontWeight: "800" },
  textLink: { alignSelf: "center", paddingVertical: 5 },
  linkText: { color: theme.lavender, fontSize: 11, fontWeight: "800" },
  statusCard: { gap: 7 },
  error: { borderRadius: 10, backgroundColor: "rgba(240, 90, 114,0.1)", color: theme.coral, padding: 11, fontSize: 11, lineHeight: 17 },
  footerNote: { color: theme.muted, fontSize: 10, lineHeight: 15, textAlign: "center" },
});
