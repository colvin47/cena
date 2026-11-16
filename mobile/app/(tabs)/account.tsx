import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Screen } from "@/components/Screen";
import { theme } from "@/components/theme";
import { useCenaAuth } from "@/hooks/CenaAuth";

type Mode = "login" | "register" | "reset";

export default function AccountScreen() {
  const { user, loading: authLoading, sessionError, refreshSession, login, register, requestPasswordReset, logout } = useCenaAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountType, setAccountType] = useState<"listener" | "artist">("listener");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const submit = async () => {
    setBusy(true);
    setNotice("");
    setError("");
    try {
      if (mode === "register") {
        await register({ name, email, password, accountType });
        setMode("login");
        setPassword("");
        setNotice("Se o endereço puder ser usado e o envio estiver disponível, receberá um link de confirmação. Terá de confirmar o e-mail antes de entrar.");
      } else if (mode === "reset") {
        await requestPasswordReset(email);
        setNotice("Se existir uma conta CENA verificada com este endereço, receberá instruções temporárias para recuperar o acesso.");
      } else {
        await login(email, password);
        setNotice("");
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Não foi possível concluir o pedido. Tente novamente.");
    } finally {
      setBusy(false);
    }
  };

  const changeMode = (next: Mode) => {
    setMode(next);
    setNotice("");
    setError("");
  };

  if (authLoading) {
    return <Screen><View style={styles.header}><Text style={styles.eyebrow}>CENA · CONTA</Text><Text style={styles.title}>A abrir a sua conta…</Text></View></Screen>;
  }

  if (user) {
    return (
      <Screen>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>CENA · CONTA</Text>
          <Text style={styles.title}>A sua presença.</Text>
          <Text style={styles.subtitle}>O acesso é seu; os favoritos continuam guardados apenas neste aparelho.</Text>
        </View>
        <View style={styles.accountCard}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{(user.name || user.email || "C").slice(0, 1).toUpperCase()}</Text></View>
          <View style={styles.accountInfo}>
            <Text style={styles.accountName}>{user.name || "Conta CENA"}</Text>
            <Text style={styles.accountEmail}>{user.email || ""}</Text>
            <Text style={styles.accountType}>{user.accountType === "artist" ? "ARTISTA / BANDA" : "OUVINTE"}</Text>
          </View>
        </View>
        <Text style={styles.note}>Ainda não sincronizamos a biblioteca pessoal entre o Android e o site.</Text>
        <Pressable accessibilityRole="button" disabled={busy} style={styles.secondaryButton} onPress={() => { setBusy(true); void logout().catch(logoutError => setError(logoutError instanceof Error ? logoutError.message : "Não foi possível sair." )).finally(() => setBusy(false)); }}>
          <Text style={styles.secondaryButtonText}>{busy ? "A terminar sessão…" : "Terminar sessão"}</Text>
        </Pressable>
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      </Screen>
    );
  }

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.formShell}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>CENA · CONTA</Text>
          <Text style={styles.title}>{mode === "register" ? "Um lugar na cena." : mode === "reset" ? "Vamos recuperar." : "Entre do seu jeito."}</Text>
          <Text style={styles.subtitle}>Use uma conta CENA por e-mail; não precisa de entrar com uma conta Manus.</Text>
        </View>

        {mode !== "reset" ? (
          <View style={styles.modeSwitch}>
            <Pressable accessibilityRole="button" accessibilityState={{ selected: mode === "login" }} onPress={() => changeMode("login")} style={[styles.modeButton, mode === "login" && styles.modeSelected]}><Text style={[styles.modeText, mode === "login" && styles.modeTextSelected]}>Entrar</Text></Pressable>
            <Pressable accessibilityRole="button" accessibilityState={{ selected: mode === "register" }} onPress={() => changeMode("register")} style={[styles.modeButton, mode === "register" && styles.modeSelected]}><Text style={[styles.modeText, mode === "register" && styles.modeTextSelected]}>Criar conta</Text></Pressable>
          </View>
        ) : null}

        <View style={styles.fields}>
          {mode === "register" ? <Field label="Nome" value={name} onChangeText={setName} placeholder="Como devemos chamar-lhe?" autoCapitalize="words" /> : null}
          <Field label="E-mail" value={email} onChangeText={setEmail} placeholder="nome@exemplo.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
          {mode !== "reset" ? <Field label="Palavra-passe" value={password} onChangeText={setPassword} placeholder={mode === "register" ? "Pelo menos 12 caracteres" : "A sua palavra-passe"} secureTextEntry autoCapitalize="none" autoComplete={mode === "register" ? "new-password" : "current-password"} /> : null}
        </View>

        {mode === "register" ? (
          <View style={styles.roleGroup}>
            <Text style={styles.fieldLabel}>Como vai usar o CENA?</Text>
            <View style={styles.roleRow}>
              <Pressable accessibilityRole="button" accessibilityState={{ selected: accountType === "listener" }} onPress={() => setAccountType("listener")} style={[styles.roleButton, accountType === "listener" && styles.roleSelected]}><Text style={[styles.roleText, accountType === "listener" && styles.roleTextSelected]}>Ouvinte</Text></Pressable>
              <Pressable accessibilityRole="button" accessibilityState={{ selected: accountType === "artist" }} onPress={() => setAccountType("artist")} style={[styles.roleButton, accountType === "artist" && styles.roleSelected]}><Text style={[styles.roleText, accountType === "artist" && styles.roleTextSelected]}>Artista / banda</Text></Pressable>
            </View>
          </View>
        ) : null}

        {sessionError ? (
          <>
            <Text accessibilityRole="alert" style={styles.error}>{sessionError}</Text>
            <Pressable accessibilityRole="button" disabled={busy} onPress={() => { setBusy(true); void refreshSession().finally(() => setBusy(false)); }} style={styles.textLink}>
              <Text style={styles.linkText}>{busy ? "A validar sessão…" : "Tentar validar sessão novamente"}</Text>
            </Pressable>
          </>
        ) : null}
        {notice ? <Text accessibilityRole="alert" style={styles.notice}>{notice}</Text> : null}
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}

        <Pressable accessibilityRole="button" disabled={busy} onPress={() => void submit()} style={[styles.primaryButton, busy && styles.disabled]}>
          <Text style={styles.primaryButtonText}>{busy ? "Aguarde…" : mode === "register" ? "Enviar confirmação" : mode === "reset" ? "Pedir recuperação" : "Entrar na CENA"}</Text>
        </Pressable>

        {mode === "login" ? <Pressable accessibilityRole="button" onPress={() => changeMode("reset")} style={styles.textLink}><Text style={styles.linkText}>Esqueceu a palavra-passe?</Text></Pressable> : null}
        {mode === "reset" ? <Pressable accessibilityRole="button" onPress={() => changeMode("login")} style={styles.textLink}><Text style={styles.linkText}>Voltar ao início de sessão</Text></Pressable> : null}
        <Text style={styles.footerNote}>O Manus fica disponível como opção temporária no site. A sua biblioteca local não é enviada para o servidor.</Text>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function Field(props: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; secureTextEntry?: boolean; keyboardType?: "email-address" | "default"; autoCapitalize?: "none" | "words"; autoComplete?: "email" | "current-password" | "new-password" }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{props.label}</Text>
      <TextInput
        accessibilityLabel={props.label}
        autoCapitalize={props.autoCapitalize || "none"}
        autoComplete={props.autoComplete}
        keyboardType={props.keyboardType || "default"}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        placeholderTextColor={theme.muted}
        secureTextEntry={props.secureTextEntry}
        style={styles.input}
        value={props.value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  formShell: { gap: 18 },
  header: { gap: 8 },
  eyebrow: { color: theme.coral, fontSize: 9, fontWeight: "900", letterSpacing: 1.5 },
  title: { color: theme.text, fontSize: 29, fontWeight: "900", letterSpacing: -0.7 },
  subtitle: { color: theme.muted, fontSize: 12, lineHeight: 18 },
  modeSwitch: { padding: 4, flexDirection: "row", gap: 4, borderRadius: 12, backgroundColor: theme.surfaceRaised },
  modeButton: { flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: 9 },
  modeSelected: { backgroundColor: theme.surface },
  modeText: { color: theme.muted, fontSize: 12, fontWeight: "800" },
  modeTextSelected: { color: theme.lime },
  fields: { gap: 13 },
  field: { gap: 7 },
  fieldLabel: { color: theme.text, fontSize: 11, fontWeight: "800" },
  input: { minHeight: 48, borderRadius: 11, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.surface, paddingHorizontal: 13, color: theme.text, fontSize: 13 },
  roleGroup: { gap: 8 },
  roleRow: { flexDirection: "row", gap: 8 },
  roleButton: { flex: 1, borderRadius: 11, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.surface, paddingVertical: 12, alignItems: "center" },
  roleSelected: { borderColor: theme.lime, backgroundColor: "rgba(240, 90, 114,0.08)" },
  roleText: { color: theme.muted, fontSize: 11, fontWeight: "800" },
  roleTextSelected: { color: theme.lime },
  primaryButton: { minHeight: 48, justifyContent: "center", alignItems: "center", paddingHorizontal: 16, borderRadius: 12, backgroundColor: theme.lime },
  primaryButtonText: { color: theme.background, fontSize: 13, fontWeight: "900" },
  disabled: { opacity: 0.55 },
  textLink: { alignSelf: "center", paddingVertical: 5 },
  linkText: { color: theme.lavender, fontSize: 11, fontWeight: "800" },
  footerNote: { color: theme.muted, fontSize: 10, lineHeight: 15, textAlign: "center" },
  notice: { borderRadius: 10, backgroundColor: "rgba(240, 90, 114,0.1)", color: theme.lime, padding: 11, fontSize: 11, lineHeight: 17 },
  error: { borderRadius: 10, backgroundColor: "rgba(240, 90, 114,0.1)", color: theme.coral, padding: 11, fontSize: 11, lineHeight: 17 },
  accountCard: { flexDirection: "row", alignItems: "center", gap: 13, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.line, borderRadius: 15, padding: 15 },
  avatar: { width: 48, height: 48, alignItems: "center", justifyContent: "center", borderRadius: 24, backgroundColor: theme.lime },
  avatarText: { color: theme.background, fontSize: 20, fontWeight: "900" },
  accountInfo: { flex: 1, gap: 3 },
  accountName: { color: theme.text, fontSize: 15, fontWeight: "900" },
  accountEmail: { color: theme.muted, fontSize: 11 },
  accountType: { color: theme.lavender, fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  note: { color: theme.muted, fontSize: 11, lineHeight: 17 },
  secondaryButton: { minHeight: 46, justifyContent: "center", alignItems: "center", borderRadius: 12, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.surfaceRaised },
  secondaryButtonText: { color: theme.text, fontSize: 12, fontWeight: "800" },
});
