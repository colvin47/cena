import * as Crypto from "expo-crypto";
import * as DocumentPicker from "expo-document-picker";
import { useCallback, useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "@/components/Screen";
import { theme } from "@/components/theme";
import { useCenaAuth } from "@/hooks/CenaAuth";
import { cenaUploadContentType, MAX_AUDIO_BYTES, MAX_IMAGE_BYTES, validateCenaUploadFile } from "@/lib/upload-policy";
import type { LocalCenaFile } from "@/lib/cena-upload";

type ArtistProfile = { id: number; name: string; handle: string; profileType: string; genre: string | null; city: string; bio: string | null };
type CreateProfileResult = { persisted: boolean; profile: ArtistProfile | null };
type TrackResult = { persisted: boolean; id: number | null; duplicate?: boolean };
type CollectiveOption = { id: number; name: string; permission: string | null };
type PendingTrackAttempt = { fingerprint: string; idempotencyKey: string; audioUrl?: string; coverUrl?: string };
type ReleaseType = "single" | "album" | "demo" | "live" | "split" | "compilation";

const RELEASE_TYPES: Array<{ value: ReleaseType; label: string }> = [
  { value: "single", label: "Single" },
  { value: "album", label: "Álbum" },
  { value: "demo", label: "Demo" },
  { value: "live", label: "Ao vivo" },
  { value: "split", label: "Split" },
  { value: "compilation", label: "Compilação" },
];

function formatSize(size?: number | null) {
  if (!size || size <= 0) return "tamanho será verificado antes do envio";
  return `${(size / (1024 * 1024)).toFixed(size >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
}

function parseReleaseDate(value: string) {
  if (!value.trim()) return undefined;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) throw new Error("Use a data no formato AAAA-MM-DD.");
  const parsed = new Date(`${value.trim()}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value.trim()) throw new Error("Informe uma data de lançamento válida.");
  return parsed.toISOString();
}

export default function UploadScreen() {
  const router = useRouter();
  const { user, sessionError, query, mutation, uploadFile, setAccountType } = useCenaAuth();
  const [profile, setProfile] = useState<ArtistProfile | null>(null);
  const [collectives, setCollectives] = useState<CollectiveOption[]>([]);
  const [selectedCollectiveId, setSelectedCollectiveId] = useState<number | null>(null);
  const pendingTrackAttempt = useRef<PendingTrackAttempt | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileLoadError, setProfileLoadError] = useState("");
  const [profileName, setProfileName] = useState("");
  const [profileHandle, setProfileHandle] = useState("");
  const [profileCity, setProfileCity] = useState("");
  const [profileGenre, setProfileGenre] = useState("");
  const [profileType, setProfileType] = useState<"solo" | "band">("band");
  const [profileBio, setProfileBio] = useState("");
  const [audio, setAudio] = useState<LocalCenaFile | null>(null);
  const [cover, setCover] = useState<LocalCenaFile | null>(null);
  const [title, setTitle] = useState("");
  const [album, setAlbum] = useState("");
  const [genre, setGenre] = useState("");
  const [description, setDescription] = useState("");
  const [credits, setCredits] = useState("");
  const [releaseType, setReleaseType] = useState<ReleaseType>("single");
  const [releaseDate, setReleaseDate] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const reloadProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }
    setProfileLoading(true);
    setProfileLoadError("");
    try {
      const result = await query<ArtistProfile | null>("scene.myArtistProfile", {});
      setProfile(result);
      if (result?.genre) setGenre(previous => previous || result.genre || "");
    } catch (profileError) {
      const message = profileError instanceof Error ? profileError.message : "Não foi possível verificar o perfil artístico.";
      setProfileLoadError(message);
      setError(message);
    } finally {
      setProfileLoading(false);
    }
  }, [query, user]);

  useEffect(() => {
    let active = true;
    if (!user) {
      setProfile(null);
      setProfileLoading(false);
      setProfileLoadError("");
      return () => { active = false; };
    }
    setProfileLoading(true);
    setProfileLoadError("");
    void query<ArtistProfile | null>("scene.myArtistProfile", {}).then(result => {
      if (!active) return;
      setProfile(result);
      if (result?.genre) setGenre(previous => previous || result.genre || "");
      setProfileName(previous => previous || result?.name || user.name || "");
      if (result?.city) setProfileCity(previous => previous || result.city);
    }).catch(profileError => {
      if (active) {
        const message = profileError instanceof Error ? profileError.message : "Não foi possível verificar o perfil artístico.";
        setProfileLoadError(message);
        setError(message);
      }
    }).finally(() => { if (active) setProfileLoading(false); });
    return () => { active = false; };
  }, [query, user?.id, user?.name]);

  useEffect(() => {
    let active = true;
    if (!user || (user.accountType !== "artist" && user.role !== "admin")) {
      setCollectives([]);
      setSelectedCollectiveId(null);
      return () => { active = false; };
    }
    void query<CollectiveOption[]>("scene.myCollectives", {}).then(result => {
      if (!active) return;
      const permitted = result.filter(collective => collective.permission === "owner" || collective.permission === "editor");
      setCollectives(permitted);
      setSelectedCollectiveId(previous => previous !== null && permitted.some(collective => collective.id === previous) ? previous : null);
    }).catch(() => {
      if (active) {
        setCollectives([]);
        setSelectedCollectiveId(null);
      }
    });
    return () => { active = false; };
  }, [query, user?.id, user?.accountType, user?.role]);

  const pickFile = async (kind: "audio" | "image") => {
    setError("");
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: kind === "audio" ? ["audio/*"] : ["image/*"],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled || !result.assets[0]) return;
      const selected = result.assets[0];
      const asset: LocalCenaFile = { uri: selected.uri, name: selected.name, size: selected.size };
      if (!cenaUploadContentType(asset.name, kind)) {
        throw new Error(kind === "audio" ? "Use áudio MP3, WAV, M4A ou OGG." : "Use uma capa JPG, PNG ou WebP.");
      }
      if (asset.size && asset.size > (kind === "audio" ? MAX_AUDIO_BYTES : MAX_IMAGE_BYTES)) {
        throw new Error(kind === "audio" ? "O áudio deve ter até 50 MB." : "A capa deve ter até 10 MB.");
      }
      if (asset.size) validateCenaUploadFile(asset.name, asset.size, kind);
      if (kind === "audio") setAudio(asset);
      else setCover(asset);
    } catch (pickError) {
      setError(pickError instanceof Error ? pickError.message : "Não foi possível abrir o seletor de arquivos.");
    }
  };

  const activateArtist = async () => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await setAccountType("artist");
      setNotice("Perfil artístico ativado. Agora complete os dados do artista ou banda.");
    } catch (activateError) {
      setError(activateError instanceof Error ? activateError.message : "Não foi possível ativar o perfil artístico.");
    } finally {
      setBusy(false);
    }
  };

  const createProfile = async () => {
    if (profileName.trim().length < 2 || profileCity.trim().length < 2 || profileHandle.replace(/^@/, "").trim().length < 2) {
      setError("Informe nome, @perfil e cidade com pelo menos 2 caracteres.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await mutation<CreateProfileResult>("scene.createArtistProfile", {
        name: profileName.trim(),
        handle: profileHandle.trim().replace(/^@/, ""),
        city: profileCity.trim(),
        profileType,
        genre: profileGenre.trim() || undefined,
        bio: profileBio.trim() || undefined,
      });
      if (!result.persisted || !result.profile) throw new Error("Não foi possível salvar o perfil artístico.");
      setProfile(result.profile);
      setGenre(previous => previous || result.profile?.genre || "");
      setNotice("Perfil criado. Você já pode preparar o envio da faixa.");
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Não foi possível criar o perfil artístico.");
    } finally {
      setBusy(false);
    }
  };

  const submitTrack = async () => {
    setError("");
    setNotice("");
    const currentProfile = profile;
    if (!currentProfile) { setError("Crie um perfil artístico antes de publicar."); return; }
    if (!audio) { setError("Escolha um arquivo de áudio antes de publicar."); return; }
    if (!rightsConfirmed) { setError("Confirme que você tem os direitos ou autorização para publicar esta faixa."); return; }
    if (title.trim().length < 1 || title.trim().length > 180) { setError("Informe um título de até 180 caracteres."); return; }

    let releaseDateIso: string | undefined;
    try {
      releaseDateIso = parseReleaseDate(releaseDate);
    } catch (dateError) {
      setError(dateError instanceof Error ? dateError.message : "Data inválida.");
      return;
    }

    const fingerprint = JSON.stringify({
      profileId: currentProfile.id,
      audio: { uri: audio.uri, name: audio.name, size: audio.size ?? null },
      cover: cover ? { uri: cover.uri, name: cover.name, size: cover.size ?? null } : null,
      title: title.trim(), album: album.trim(), genre: genre.trim(), city: currentProfile.city,
      collectiveId: selectedCollectiveId, description: description.trim(), releaseType, releaseDateIso,
      visibility, credits: credits.trim(),
    });
    const existingAttempt = pendingTrackAttempt.current;
    const attempt = existingAttempt?.fingerprint === fingerprint
      ? existingAttempt
      : { fingerprint, idempotencyKey: Crypto.randomUUID() };
    pendingTrackAttempt.current = attempt;

    setBusy(true);
    setStatus("Preparando o envio…");
    let trackMutationStarted = false;
    let persistenceConfirmedAbsent = false;
    try {
      let audioUrl = attempt.audioUrl;
      if (!audioUrl) {
        setStatus("Enviando o áudio…");
        audioUrl = await uploadFile(audio, "audio", `${attempt.idempotencyKey}-audio-primary`);
        attempt.audioUrl = audioUrl;
      }

      let coverUrl = attempt.coverUrl;
      if (cover && !coverUrl) {
        setStatus("Enviando a capa…");
        coverUrl = await uploadFile(cover, "image", `${attempt.idempotencyKey}-image-cover`);
        attempt.coverUrl = coverUrl;
      }

      setStatus("Publicando a faixa…");
      trackMutationStarted = true;
      const result = await mutation<TrackResult>("scene.createTrack", {
        idempotencyKey: attempt.idempotencyKey,
        title: title.trim(),
        album: album.trim() || undefined,
        genre: genre.trim() || currentProfile.genre || undefined,
        city: currentProfile.city,
        collectiveId: selectedCollectiveId ?? undefined,
        description: description.trim() || undefined,
        releaseType,
        releaseDate: releaseDateIso,
        visibility,
        sourceType: "upload",
        creditsNote: credits.trim() || undefined,
        audioUrl,
        coverUrl,
        rightsDeclared: true,
      });
      if (!result.persisted) {
        trackMutationStarted = false;
        persistenceConfirmedAbsent = true;
        throw new Error("A API não persistiu a publicação da faixa.");
      }
      if (!result.id) throw new Error("A API não devolveu uma confirmação válida da publicação.");

      setNotice(result.duplicate ? "Publicação confirmada; esta faixa já estava na Cena." : "Faixa publicada na Cena.");
      pendingTrackAttempt.current = null;
      setAudio(null);
      setCover(null);
      setTitle("");
      setAlbum("");
      setDescription("");
      setCredits("");
      setReleaseDate("");
      setRightsConfirmed(false);
    } catch (publishError) {
      if (!trackMutationStarted) {
        const uploadedPaths = [attempt.audioUrl, attempt.coverUrl].filter((path): path is string => Boolean(path));
        if (uploadedPaths.length) {
          try { await mutation("scene.cleanupUpload", { paths: uploadedPaths }); } catch { /* limpeza best-effort antes da publicação */ }
        }
        attempt.audioUrl = undefined;
        attempt.coverUrl = undefined;
        if (persistenceConfirmedAbsent) pendingTrackAttempt.current = null;
      }
      const message = publishError instanceof Error ? publishError.message : "Não foi possível concluir o envio.";
      setError(trackMutationStarted
        ? `${message} A resposta pode ter se perdido; os arquivos foram preservados. Tente novamente sem alterar o formulário para confirmar pela mesma chave. Se não tiver certeza, confira no site antes de iniciar outro envio.`
        : message);
    } finally {
      setStatus("");
      setBusy(false);
    }
  };

  if (!user) {
    return (
      <Screen>
        <PageHeader onBack={() => router.back()} eyebrow="CENA · ENVIO" title="Publicar música." subtitle="Entre com Manus na aba Conta. Depois de validar sua sessão, você poderá criar um perfil artístico e enviar áudio pelo app." />
        {sessionError ? <Text accessibilityRole="alert" style={styles.error}>{sessionError}</Text> : null}
        <Pressable accessibilityRole="button" onPress={() => router.push("/(tabs)/account")} style={styles.primaryButton}><Text style={styles.primaryButtonText}>Abrir Conta e entrar</Text></Pressable>
      </Screen>
    );
  }

  const canPublish = user.accountType === "artist" || user.role === "admin";
  return (
    <Screen>
      <PageHeader onBack={() => router.back()} eyebrow="CENA · ENVIO" title="Coloque seu som na rua." subtitle="O app usa o mesmo fluxo de upload e publicação do site CENA." />
      {sessionError ? <Text accessibilityRole="alert" style={styles.error}>{sessionError}</Text> : null}
      {!canPublish ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Primeiro, ative o perfil artístico.</Text>
          <Text style={styles.body}>Essa escolha libera as ferramentas de artista para a sua conta Manus. Ela não publica nada.</Text>
          <Pressable accessibilityRole="button" disabled={busy} onPress={() => void activateArtist()} style={[styles.primaryButton, busy && styles.disabled]}><Text style={styles.primaryButtonText}>{busy ? "Salvando…" : "Ativar perfil de artista"}</Text></Pressable>
        </View>
      ) : profileLoading ? (
        <View style={styles.card}><Text style={styles.body}>Verificando seu perfil artístico…</Text></View>
      ) : profileLoadError ? (
        <View style={styles.card}>
          <Text accessibilityRole="alert" style={styles.error}>{profileLoadError}</Text>
          <Pressable accessibilityRole="button" disabled={busy} onPress={() => void reloadProfile()} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Tentar novamente</Text></Pressable>
        </View>
      ) : !profile ? (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.formShell}>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Crie seu perfil de artista.</Text>
            <Text style={styles.body}>O perfil é necessário para atribuir a faixa à pessoa ou banda certa.</Text>
            <Field label="Nome do artista / banda" value={profileName} onChangeText={setProfileName} placeholder="Ex.: Banda CENA" maxLength={160} />
            <Field label="@perfil" value={profileHandle} onChangeText={setProfileHandle} placeholder="nome_do_projeto" autoCapitalize="none" maxLength={80} />
            <Field label="Cidade" value={profileCity} onChangeText={setProfileCity} placeholder="Ex.: Campinas" maxLength={120} />
            <Field label="Gênero (opcional)" value={profileGenre} onChangeText={setProfileGenre} placeholder="Ex.: Punk" maxLength={80} />
            <Field label="Bio (opcional)" value={profileBio} onChangeText={setProfileBio} placeholder="Conte sobre o projeto" maxLength={1000} multiline />
            <Text style={styles.fieldLabel}>Tipo de perfil</Text>
            <ChoiceRow choices={[{ value: "band", label: "Banda" }, { value: "solo", label: "Solo" }]} selected={profileType} onSelect={value => setProfileType(value as "solo" | "band")} />
            <Pressable accessibilityRole="button" disabled={busy} onPress={() => void createProfile()} style={[styles.primaryButton, busy && styles.disabled]}><Text style={styles.primaryButtonText}>{busy ? "Criando perfil…" : "Criar perfil artístico"}</Text></Pressable>
          </View>
        </KeyboardAvoidingView>
      ) : (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.formShell}>
          <View style={styles.profileBanner}>
            <View style={styles.profileBannerCopy}><Text style={styles.eyebrow}>PERFIL ARTÍSTICO</Text><Text style={styles.profileName}>{profile.name}</Text><Text style={styles.body}>{profile.handle} · {profile.city}</Text></View>
            <Pressable accessibilityRole="button" onPress={() => { setProfile(null); void reloadProfile(); }} style={styles.textButton}><Text style={styles.linkText}>Atualizar</Text></Pressable>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Arquivo de áudio</Text>
            <Text style={styles.body}>MP3, WAV, M4A ou OGG · até 50 MB</Text>
            <Pressable accessibilityRole="button" disabled={busy} onPress={() => void pickFile("audio")} style={styles.filePicker}>
              <Text style={styles.filePickerTitle}>{audio ? audio.name : "Escolher áudio"}</Text>
              <Text style={styles.filePickerDetail}>{audio ? formatSize(audio.size) : "Selecionar arquivo neste aparelho"}</Text>
            </Pressable>

            <Text style={styles.sectionTitle}>Informações da faixa</Text>
            <Field label="Título *" value={title} onChangeText={setTitle} placeholder="Nome da faixa" maxLength={180} />
            <Field label="Álbum / lançamento (opcional)" value={album} onChangeText={setAlbum} placeholder="Nome do álbum" maxLength={180} />
            <Field label="Gênero (opcional)" value={genre} onChangeText={setGenre} placeholder={profile.genre || "Ex.: Punk"} maxLength={80} />
            <Field label="Descrição (opcional)" value={description} onChangeText={setDescription} placeholder="Apresente a faixa" maxLength={1000} multiline />
            <Field label="Créditos (opcional)" value={credits} onChangeText={setCredits} placeholder="Composição, produção, participação…" maxLength={1500} multiline />
            <Field label="Data de lançamento (opcional)" value={releaseDate} onChangeText={setReleaseDate} placeholder="AAAA-MM-DD" maxLength={10} />

            <Text style={styles.fieldLabel}>Tipo de lançamento</Text>
            <ChoiceRow choices={RELEASE_TYPES} selected={releaseType} onSelect={value => setReleaseType(value as ReleaseType)} />
            <Text style={styles.fieldLabel}>Visibilidade</Text>
            <ChoiceRow choices={[{ value: "public", label: "Pública" }, { value: "private", label: "Privada" }]} selected={visibility} onSelect={value => setVisibility(value as "public" | "private")} />
            {collectives.length > 0 ? (
              <>
                <Text style={styles.fieldLabel}>Publicar em nome de</Text>
                <ChoiceRow choices={[{ value: "personal", label: "Meu projeto artístico" }, ...collectives.map(collective => ({ value: String(collective.id), label: collective.name }))]} selected={selectedCollectiveId === null ? "personal" : String(selectedCollectiveId)} onSelect={value => setSelectedCollectiveId(value === "personal" ? null : Number(value))} />
                <Text style={styles.body}>O coletivo ficará visível como contexto da publicação.</Text>
              </>
            ) : null}

            <Text style={styles.sectionTitle}>Capa (opcional)</Text>
            <Text style={styles.body}>JPG, PNG ou WebP · até 10 MB</Text>
            <Pressable accessibilityRole="button" disabled={busy} onPress={() => void pickFile("image")} style={styles.filePicker}>
              <Text style={styles.filePickerTitle}>{cover ? cover.name : "Escolher capa"}</Text>
              <Text style={styles.filePickerDetail}>{cover ? formatSize(cover.size) : "Selecionar imagem neste aparelho"}</Text>
            </Pressable>
            {cover ? <Pressable accessibilityRole="button" onPress={() => setCover(null)} style={styles.textButton}><Text style={styles.linkText}>Remover capa</Text></Pressable> : null}

            <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: rightsConfirmed }} onPress={() => setRightsConfirmed(value => !value)} style={styles.rightsRow}>
              <View style={[styles.checkbox, rightsConfirmed && styles.checkboxChecked]}>{rightsConfirmed ? <Text style={styles.checkmark}>✓</Text> : null}</View>
              <Text style={styles.rightsText}>Confirmo que tenho os direitos ou autorização necessários para enviar e divulgar esta faixa.</Text>
            </Pressable>

            {status ? <Text accessibilityRole="status" style={styles.status}>{status}</Text> : null}
            {notice ? <Text accessibilityRole="status" style={styles.notice}>{notice}</Text> : null}
            {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
            <Pressable accessibilityRole="button" disabled={busy} onPress={() => void submitTrack()} style={[styles.primaryButton, busy && styles.disabled]}>
              <Text style={styles.primaryButtonText}>{busy ? status || "Enviando…" : "Publicar faixa"}</Text>
            </Pressable>
            <Text style={styles.footerNote}>O envio só começa depois que você tocar em Publicar faixa. A API CENA valida sessão, perfil, formato, tamanho, propriedade dos arquivos e direitos declarados.</Text>
          </View>
        </KeyboardAvoidingView>
      )}

      {notice && !profile ? <Text accessibilityRole="status" style={styles.notice}>{notice}</Text> : null}
      {error && !profile ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    </Screen>
  );
}

function PageHeader({ onBack, eyebrow, title, subtitle }: { onBack: () => void; eyebrow: string; title: string; subtitle: string }) {
  return (
    <View style={styles.header}>
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}><Text style={styles.linkText}>‹ Voltar</Text></Pressable>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{subtitle}</Text>
    </View>
  );
}

function Field({ label, ...props }: { label: string } & TextInputProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput {...props} placeholderTextColor={theme.muted} style={[styles.input, props.multiline && styles.multilineInput, props.style]} />
    </View>
  );
}

function ChoiceRow({ choices, selected, onSelect }: { choices: Array<{ value: string; label: string }>; selected: string; onSelect: (value: string) => void }) {
  return (
    <View style={styles.choiceRow}>
      {choices.map(choice => (
        <Pressable key={choice.value} accessibilityRole="button" accessibilityState={{ selected: selected === choice.value }} onPress={() => onSelect(choice.value)} style={[styles.choice, selected === choice.value && styles.choiceSelected]}>
          <Text style={[styles.choiceText, selected === choice.value && styles.choiceTextSelected]}>{choice.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { gap: 8 },
  backButton: { alignSelf: "flex-start", paddingVertical: 3 },
  eyebrow: { color: theme.coral, fontSize: 9, fontWeight: "900", letterSpacing: 1.5 },
  title: { color: theme.text, fontSize: 28, fontWeight: "900", letterSpacing: -0.7 },
  body: { color: theme.muted, fontSize: 12, lineHeight: 18 },
  formShell: { gap: 12 },
  card: { gap: 13, padding: 15, borderRadius: 15, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.surface },
  sectionTitle: { color: theme.text, fontSize: 15, fontWeight: "900", marginTop: 2 },
  profileBanner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, padding: 14, borderRadius: 14, backgroundColor: theme.surfaceRaised },
  profileBannerCopy: { flex: 1, gap: 3 },
  profileName: { color: theme.text, fontSize: 16, fontWeight: "900" },
  field: { gap: 7 },
  fieldLabel: { color: theme.text, fontSize: 11, fontWeight: "800" },
  input: { minHeight: 46, borderRadius: 11, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.background, paddingHorizontal: 12, color: theme.text, fontSize: 13 },
  multilineInput: { minHeight: 80, paddingTop: 11, textAlignVertical: "top" },
  choiceRow: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  choice: { minHeight: 38, justifyContent: "center", alignItems: "center", paddingHorizontal: 12, borderRadius: 11, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.background },
  choiceSelected: { borderColor: theme.lime, backgroundColor: "rgba(240,90,114,0.12)" },
  choiceText: { color: theme.muted, fontSize: 11, fontWeight: "800" },
  choiceTextSelected: { color: theme.lime },
  filePicker: { minHeight: 66, justifyContent: "center", gap: 3, padding: 12, borderRadius: 12, borderWidth: 1, borderStyle: "dashed", borderColor: theme.lavender, backgroundColor: theme.background },
  filePickerTitle: { color: theme.text, fontSize: 12, fontWeight: "900" },
  filePickerDetail: { color: theme.muted, fontSize: 10 },
  primaryButton: { minHeight: 48, justifyContent: "center", alignItems: "center", paddingHorizontal: 16, borderRadius: 12, backgroundColor: theme.lime },
  primaryButtonText: { color: theme.background, fontSize: 13, fontWeight: "900", textAlign: "center" },
  secondaryButton: { minHeight: 44, justifyContent: "center", alignItems: "center", borderRadius: 11, borderWidth: 1, borderColor: theme.line, backgroundColor: theme.surfaceRaised },
  secondaryButtonText: { color: theme.text, fontSize: 12, fontWeight: "800" },
  disabled: { opacity: 0.55 },
  textButton: { alignSelf: "flex-start", paddingVertical: 5 },
  linkText: { color: theme.lavender, fontSize: 11, fontWeight: "800" },
  rightsRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 6 },
  checkbox: { width: 20, height: 20, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: theme.lavender, borderRadius: 5 },
  checkboxChecked: { borderColor: theme.lime, backgroundColor: theme.lime },
  checkmark: { color: theme.background, fontSize: 14, lineHeight: 17, fontWeight: "900" },
  rightsText: { flex: 1, color: theme.text, fontSize: 11, lineHeight: 17 },
  status: { color: theme.lavender, fontSize: 11, fontWeight: "700" },
  notice: { borderRadius: 10, backgroundColor: "rgba(240,90,114,0.12)", color: theme.lime, padding: 11, fontSize: 11, lineHeight: 17 },
  error: { borderRadius: 10, backgroundColor: "rgba(240,90,114,0.12)", color: theme.coral, padding: 11, fontSize: 11, lineHeight: 17 },
  footerNote: { color: theme.muted, fontSize: 10, lineHeight: 15 },
});
