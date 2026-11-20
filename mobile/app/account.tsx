import { useState } from "react";
import * as DocumentPicker from "expo-document-picker";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Screen } from "@/components/Screen";
import { theme } from "@/components/theme";
import { createTrack, uploadFile } from "@/lib/cena-api";
import { useCenaAuth } from "@/hooks/CenaAuth";
import { useLocalCity } from "@/hooks/LocalCity";

type Picked = { uri: string; name: string; size: number; mimeType: string };
const uploadId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;

export default function AccountScreen() {
  const auth = useCenaAuth();
  const { city } = useLocalCity();
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [audio, setAudio] = useState<Picked | null>(null);
  const [cover, setCover] = useState<Picked | null>(null);
  const [rights, setRights] = useState(false);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const pick = async (kind: "audio" | "image") => {
    const result = await DocumentPicker.getDocumentAsync({ type: kind === "audio" ? ["audio/mpeg", "audio/wav", "audio/mp4", "audio/ogg"] : ["image/jpeg", "image/png", "image/webp"], copyToCacheDirectory: true, multiple: false });
    if (result.canceled || !result.assets[0]) return;
    const item = result.assets[0];
    const picked = { uri: item.uri, name: item.name, size: item.size || 0, mimeType: item.mimeType || (kind === "audio" ? "audio/mpeg" : "image/jpeg") };
    if (kind === "audio") setAudio(picked); else setCover(picked);
  };

  const publish = async () => {
    if (!auth.token || !audio || !title.trim() || !rights) return;
    setWorking(true); setMessage(null);
    try {
      const audioUrl = await uploadFile(auth.token, { uri: audio.uri, fileName: audio.name, contentType: audio.mimeType, kind: "audio", uploadId: uploadId() });
      const coverUrl = cover ? await uploadFile(auth.token, { uri: cover.uri, fileName: cover.name, contentType: cover.mimeType, kind: "image", uploadId: uploadId() }) : undefined;
      const result = await createTrack(auth.token, { title: title.trim(), genre: genre.trim() || undefined, city, audioUrl, coverUrl, releaseType: "single", rightsDeclared: true });
      setMessage(result.persisted ? "Faixa enviada para publicação." : "O envio foi recebido, mas aguarda disponibilidade do banco.");
      setTitle(""); setGenre(""); setAudio(null); setCover(null); setRights(false);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível publicar a faixa."); }
    finally { setWorking(false); }
  };

  if (auth.loading) return <Screen><Text style={styles.muted}>Carregando sua conta…</Text></Screen>;
  if (!auth.user) return <Screen><Text style={styles.kicker}>CENA · CONTA</Text><Text style={styles.title}>Entre para fazer parte da cena.</Text><Text style={styles.body}>O login abre o navegador do sistema. O app recebe somente um ticket temporário e guarda a sessão com segurança no aparelho.</Text><Pressable style={styles.primary} onPress={() => void auth.signIn().catch(error => setMessage(error instanceof Error ? error.message : "Não foi possível entrar."))}><Text style={styles.primaryText}>ENTRAR COM MANUS</Text></Pressable>{message ? <Text style={styles.error}>{message}</Text> : null}</Screen>;

  return <Screen><View style={styles.header}><View><Text style={styles.kicker}>CENA · CONTA</Text><Text style={styles.title}>{auth.user.name || "Sua conta"}</Text><Text style={styles.body}>{auth.user.email || "Sessão protegida no aparelho."}</Text></View><Pressable onPress={() => void auth.signOut()}><Text style={styles.link}>SAIR</Text></Pressable></View><View style={styles.card}><Text style={styles.cardTitle}>Publicar uma faixa</Text><Text style={styles.body}>Envie áudio e capa pelo storage oficial. A CENA não processa pagamento nem confirma direitos por você.</Text><TextInput value={title} onChangeText={setTitle} placeholder="Título da faixa" placeholderTextColor={theme.muted} style={styles.input} /><TextInput value={genre} onChangeText={setGenre} placeholder="Gênero (opcional)" placeholderTextColor={theme.muted} style={styles.input} /><Pressable style={styles.fileButton} onPress={() => void pick("audio")}><Text style={styles.fileText}>{audio ? `ÁUDIO · ${audio.name}` : "ESCOLHER ÁUDIO · MP3, WAV, M4A OU OGG"}</Text></Pressable><Pressable style={styles.fileButton} onPress={() => void pick("image")}><Text style={styles.fileText}>{cover ? `CAPA · ${cover.name}` : "ESCOLHER CAPA · OPCIONAL"}</Text></Pressable><Pressable style={styles.checkRow} onPress={() => setRights(value => !value)}><View style={[styles.checkbox, rights && styles.checkboxActive]} /><Text style={styles.body}>Confirmo que tenho autorização para publicar este áudio e esta capa.</Text></Pressable><Pressable disabled={working || !audio || !title.trim() || !rights} style={[styles.primary, (working || !audio || !title.trim() || !rights) && styles.disabled]} onPress={() => void publish()}><Text style={styles.primaryText}>{working ? "ENVIANDO…" : "PUBLICAR FAIXA"}</Text></Pressable>{message ? <Text style={message.includes("enviada") ? styles.success : styles.error}>{message}</Text> : null}</View></Screen>;
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  kicker: { color: theme.coral, fontSize: 10, fontWeight: "900", letterSpacing: 1.4 },
  title: { color: theme.text, fontSize: 29, lineHeight: 33, fontWeight: "900", marginTop: 7 },
  body: { color: theme.muted, fontSize: 12, lineHeight: 18, marginTop: 8 },
  muted: { color: theme.muted },
  link: { color: theme.coral, fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  card: { backgroundColor: theme.surface, borderColor: theme.line, borderWidth: 1, borderRadius: 16, padding: 15, gap: 11 },
  cardTitle: { color: theme.text, fontSize: 19, fontWeight: "900" },
  input: { minHeight: 46, borderBottomWidth: 1, borderBottomColor: theme.line, color: theme.text, fontSize: 14, paddingHorizontal: 4 },
  fileButton: { borderWidth: 1, borderColor: theme.line, borderRadius: 11, padding: 13, backgroundColor: theme.surfaceRaised },
  fileText: { color: theme.coral, fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },
  checkRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  checkbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 1, borderColor: theme.line },
  checkboxActive: { backgroundColor: theme.coral, borderColor: theme.coral },
  primary: { minHeight: 48, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: theme.coral, paddingHorizontal: 16 },
  primaryText: { color: theme.background, fontSize: 11, fontWeight: "900", letterSpacing: 0.8 },
  disabled: { opacity: 0.4 },
  error: { color: theme.rose, fontSize: 12, lineHeight: 17 },
  success: { color: theme.coral, fontSize: 12, lineHeight: 17 },
});
