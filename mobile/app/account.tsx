import { useEffect, useState } from "react";
import * as DocumentPicker from "expo-document-picker";
import * as Linking from "expo-linking";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Screen } from "@/components/Screen";
import { theme } from "@/components/theme";
import { cancelCreatorEvent, completeCompliance, createArtistProfile, createCreatorEvent, createMerchandise, createTrack, deleteCreatorEvent, deleteMerchandise, getCompliance, getCreatorEvents, getCreatorMerchandise, getCreatorProfile, getCreatorStats, getCreatorTracks, updateCreatorEvent, updateCreatorProfile, updateListenerProfile, updateMerchandise, uploadFile } from "@/lib/cena-api";
import type { CreatorEvent, CreatorMerchandise, CreatorProfile, CreatorStats, CreatorTrack } from "@/lib/types";
import { useCenaAuth } from "@/hooks/CenaAuth";
import { useLocalCity } from "@/hooks/LocalCity";

type Picked = { uri: string; name: string; size: number; mimeType: string };
const uploadId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
const statusLabel: Record<string, string> = { published: "PUBLICADA", pending_review: "EM REVISÃO", takedown: "RETIRADA" };
const formatDate = (value?: string | Date | null) => value ? new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }) : "Data a confirmar";
const normalizeProfileType = (value: string) => {
  const aliases: Record<string, string> = { banda: "band", coletivo: "collective", selo: "label", espaco: "cultural_space", "espaço cultural": "cultural_space", "casa de show": "venue", bar: "bar", zine: "zine" };
  const normalized = value.trim().toLowerCase();
  const candidate = aliases[normalized] || normalized;
  const accepted = new Set(["solo", "band", "mc", "producer", "dj", "collective", "label", "venue", "bar", "zine", "cultural_space", "festival", "media", "record_store", "organizer", "other"]);
  return accepted.has(candidate) ? candidate : "other";
};

export default function AccountScreen() {
  const auth = useCenaAuth();
  const { city } = useLocalCity();
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [audio, setAudio] = useState<Picked | null>(null);
  const [cover, setCover] = useState<Picked | null>(null);
  const [rights, setRights] = useState(false);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [stats, setStats] = useState<CreatorStats | null>(null);
  const [tracks, setTracks] = useState<CreatorTrack[]>([]);
  const [events, setEvents] = useState<CreatorEvent[]>([]);
  const [merch, setMerch] = useState<CreatorMerchandise[]>([]);
  const [loadingCreator, setLoadingCreator] = useState(false);
  const [merchTitle, setMerchTitle] = useState("");
  const [merchPrice, setMerchPrice] = useState("");
  const [merchStock, setMerchStock] = useState("0");
  const [merchUrl, setMerchUrl] = useState("");
  const [editingMerchId, setEditingMerchId] = useState<number | null>(null);
  const [profileName, setProfileName] = useState("");
  const [profileHandle, setProfileHandle] = useState("");
  const [profileType, setProfileType] = useState("solo");
  const [profileGenre, setProfileGenre] = useState("");
  const [profileBio, setProfileBio] = useState("");
  const [profileManifesto, setProfileManifesto] = useState("");
  const [profileSupportUrl, setProfileSupportUrl] = useState("");
  const [profilePixUrl, setProfilePixUrl] = useState("");
  const [profileMerchUrl, setProfileMerchUrl] = useState("");
  const [profileInstagramUrl, setProfileInstagramUrl] = useState("");
  const [profileBandcampUrl, setProfileBandcampUrl] = useState("");
  const [listenerCity, setListenerCity] = useState(city);
  const [listenerGenres, setListenerGenres] = useState("");
  const [listenerBio, setListenerBio] = useState("");
  const [eventEditingId, setEventEditingId] = useState<number | null>(null);
  const [eventName, setEventName] = useState("");
  const [eventVenue, setEventVenue] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventTicketUrl, setEventTicketUrl] = useState("");
  const [compliance, setCompliance] = useState<{ adultVerified: boolean; emailVerified: boolean; email: string | null } | null>(null);
  const [complianceReady, setComplianceReady] = useState(false);
  const [birthDate, setBirthDate] = useState("");
  const [complianceWorking, setComplianceWorking] = useState(false);

  const loadCreator = async () => {
    if (!auth.token || auth.user?.accountType !== "artist") return;
    setLoadingCreator(true);
    try {
      const [nextProfile, nextStats, nextTracks, nextEvents, nextMerch] = await Promise.all([
        getCreatorProfile(auth.token), getCreatorStats(auth.token), getCreatorTracks(auth.token), getCreatorEvents(auth.token), getCreatorMerchandise(auth.token),
      ]);
      setProfile(nextProfile); setStats(nextStats); setTracks(nextTracks); setEvents(nextEvents); setMerch(nextMerch);
      if (nextProfile) { setProfileName(nextProfile.name || ""); setProfileHandle(nextProfile.handle?.replace(/^@/, "") || ""); setProfileType(nextProfile.profileType || "solo"); setProfileGenre(nextProfile.genre || ""); setProfileBio(nextProfile.bio || ""); setProfileManifesto(nextProfile.manifesto || ""); setProfileSupportUrl(nextProfile.supportUrl || ""); setProfilePixUrl(nextProfile.pixUrl || ""); setProfileMerchUrl(nextProfile.merchUrl || ""); setProfileInstagramUrl(nextProfile.instagramUrl || ""); setProfileBandcampUrl(nextProfile.bandcampUrl || ""); }
    } catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível carregar o Centro do Criador."); }
    finally { setLoadingCreator(false); }
  };
  useEffect(() => { void loadCreator(); }, [auth.token, auth.user?.accountType]);
  useEffect(() => { setListenerCity(auth.user?.city || city); setListenerGenres(auth.user?.favoriteGenres || ""); setListenerBio(auth.user?.publicBio || ""); }, [auth.user?.city, auth.user?.favoriteGenres, auth.user?.publicBio, city]);
  useEffect(() => { setComplianceReady(false); if (auth.token) void getCompliance(auth.token).then(setCompliance).catch(error => { setCompliance(null); setMessage(error instanceof Error ? error.message : "Não foi possível consultar a conformidade da conta."); }).finally(() => setComplianceReady(true)); else { setCompliance(null); setComplianceReady(true); } }, [auth.token]);

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
      const result = await createTrack(auth.token, { title: title.trim(), genre: genre.trim() || undefined, lyrics: lyrics.trim() || undefined, city, audioUrl, coverUrl, releaseType: "single", rightsDeclared: true });
      setMessage(result.persisted ? "Faixa enviada para publicação." : "O envio foi recebido, mas aguarda disponibilidade do banco.");
      setTitle(""); setGenre(""); setLyrics(""); setAudio(null); setCover(null); setRights(false); void loadCreator();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível publicar a faixa."); }
    finally { setWorking(false); }
  };

  const saveMerch = async () => {
    if (!auth.token || !merchTitle.trim() || !merchPrice.trim()) return;
    setWorking(true); setMessage(null);
    try {
      const input = { title: merchTitle.trim(), price: merchPrice.trim(), stock: Math.max(0, Number(merchStock) || 0), externalUrl: merchUrl.trim() || undefined };
      if (editingMerchId) await updateMerchandise(auth.token, { ...input, id: editingMerchId }); else await createMerchandise(auth.token, input);
      setMerchTitle(""); setMerchPrice(""); setMerchStock("0"); setMerchUrl(""); setEditingMerchId(null); setMessage(editingMerchId ? "Merchandise atualizado." : "Merchandise informativo adicionado."); void loadCreator();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível salvar o merchandise."); }
    finally { setWorking(false); }
  };

  const editMerch = (item: CreatorMerchandise) => { setEditingMerchId(item.id); setMerchTitle(item.title); setMerchPrice(String(item.price)); setMerchStock(String(item.stock)); setMerchUrl(item.externalUrl || ""); };

  const saveProfile = async () => {
    if (!auth.token || !profileName.trim() || !profileHandle.trim() || !city.trim()) return;
    setWorking(true); setMessage(null);
    try {
      const input = { name: profileName.trim(), handle: profileHandle.trim(), city, profileType: normalizeProfileType(profileType || "solo"), genre: profileGenre.trim() || undefined, bio: profileBio.trim() || undefined, manifesto: profileManifesto.trim() || undefined, supportUrl: profileSupportUrl.trim() || undefined, pixUrl: profilePixUrl.trim() || undefined, merchUrl: profileMerchUrl.trim() || undefined };
      if (profile) {
        await updateCreatorProfile(auth.token, { ...input, instagramUrl: profileInstagramUrl.trim() || undefined, bandcampUrl: profileBandcampUrl.trim() || undefined });
        setMessage("Perfil atualizado.");
      } else {
        const created = await createArtistProfile(auth.token, input);
        if (!created.persisted || !created.profile) throw new Error("O perfil não foi salvo. Tente novamente.");
        setMessage("Perfil de artista criado.");
      }
      void loadCreator();
    }
    catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível atualizar o perfil."); }
    finally { setWorking(false); }
  };

  const saveCompliance = async () => {
    if (!auth.token || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate) || !compliance?.emailVerified) return;
    setComplianceWorking(true); setMessage(null);
    try { await completeCompliance(auth.token, birthDate); const updated = await getCompliance(auth.token); setCompliance(updated); setMessage("Maioridade confirmada. A data de nascimento fica privada e não aparece no perfil."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível confirmar a maioridade."); }
    finally { setComplianceWorking(false); }
  };

  const saveListener = async () => {
    if (!auth.token || !listenerCity.trim()) return;
    setWorking(true); setMessage(null);
    try { await updateListenerProfile(auth.token, { city: listenerCity.trim(), favoriteGenres: listenerGenres.trim() || undefined, publicBio: listenerBio.trim() || undefined }); await auth.refresh(); setMessage("Preferências de ouvinte salvas. Elas não criam um perfil público."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível salvar suas preferências."); }
    finally { setWorking(false); }
  };

  const resetEventForm = () => { setEventEditingId(null); setEventName(""); setEventVenue(""); setEventDate(""); setEventDescription(""); setEventTicketUrl(""); };
  const editEvent = (event: CreatorEvent) => { setEventEditingId(event.id); setEventName(event.name || event.title || ""); setEventVenue(event.venue || event.place || ""); setEventDate(event.eventDate ? new Date(event.eventDate).toISOString().slice(0, 16) : ""); setEventDescription(event.description || ""); setEventTicketUrl(event.ticketUrl || ""); };
  const saveEvent = async () => {
    if (!auth.token || !eventName.trim() || !eventVenue.trim() || !eventDate.trim()) return;
    const parsed = new Date(eventDate.includes("T") ? eventDate : `${eventDate}T20:00`);
    if (Number.isNaN(parsed.getTime())) { setMessage("Informe uma data válida no formato AAAA-MM-DDTHH:MM."); return; }
    setWorking(true); setMessage(null);
    const input = { name: eventName.trim(), venue: eventVenue.trim(), city, eventDate: parsed.toISOString(), description: eventDescription.trim() || undefined, ticketUrl: eventTicketUrl.trim() || undefined };
    try { if (eventEditingId) await updateCreatorEvent(auth.token, { ...input, id: eventEditingId }); else await createCreatorEvent(auth.token, input); setMessage(eventEditingId ? "Evento atualizado." : "Evento criado na agenda."); resetEventForm(); void loadCreator(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível salvar o evento."); }
    finally { setWorking(false); }
  };

  const removeMerch = (item: CreatorMerchandise) => {
    if (!auth.token) return;
    Alert.alert("Excluir item?", `${item.title} será removido do seu catálogo informativo.`, [{ text: "Cancelar", style: "cancel" }, { text: "Excluir", style: "destructive", onPress: () => void deleteMerchandise(auth.token!, item.id).then(() => loadCreator()).catch(error => setMessage(error instanceof Error ? error.message : "Não foi possível excluir.")) }]);
  };

  const cancelEvent = (event: CreatorEvent) => {
    if (!auth.token) return;
    Alert.alert("Cancelar evento?", `${event.name || event.title} ficará fora da agenda pública.`, [{ text: "Voltar", style: "cancel" }, { text: "Cancelar evento", style: "destructive", onPress: () => void cancelCreatorEvent(auth.token!, event.id, "Cancelado pelo criador").then(() => loadCreator()).catch(error => setMessage(error instanceof Error ? error.message : "Não foi possível cancelar o evento.")) }]);
  };

  const removeEvent = (event: CreatorEvent) => {
    if (!auth.token) return;
    Alert.alert("Excluir evento?", `${event.name || event.title} será removido permanentemente.`, [{ text: "Voltar", style: "cancel" }, { text: "Excluir", style: "destructive", onPress: () => void deleteCreatorEvent(auth.token!, event.id).then(() => loadCreator()).catch(error => setMessage(error instanceof Error ? error.message : "Não foi possível excluir o evento.")) }]);
  };

  if (auth.loading) return <Screen><Text style={styles.muted}>Carregando sua conta…</Text></Screen>;
  if (!auth.user) return <Screen><Text style={styles.kicker}>CENA · CONTA</Text><Text style={styles.title}>Entre para fazer parte da cena.</Text><Text style={styles.body}>O login abre o navegador do sistema. O app recebe somente um ticket temporário e guarda a sessão com segurança no aparelho.</Text><Pressable style={styles.primary} onPress={() => void auth.signIn().catch(error => setMessage(error instanceof Error ? error.message : "Não foi possível entrar."))}><Text style={styles.primaryText}>ENTRAR COM MANUS</Text></Pressable>{message ? <Text style={styles.error}>{message}</Text> : null}</Screen>;
  if (!complianceReady) return <Screen><Text style={styles.muted}>Verificando a proteção da conta…</Text></Screen>;
  if (!compliance || !compliance.adultVerified || !compliance.emailVerified) return <Screen><View style={styles.header}><View><Text style={styles.kicker}>CENA · CONTA</Text><Text style={styles.title}>{auth.user.name || "Sua conta"}</Text><Text style={styles.body}>{auth.user.email || "Sessão protegida no aparelho."}</Text></View><Pressable onPress={() => void auth.signOut()}><Text style={styles.link}>SAIR</Text></Pressable></View><View style={styles.complianceCard}><Text style={styles.cardTitle}>Acesso exclusivo para maiores de 18</Text><Text style={styles.body}>Para proteger a comunidade e os criadores, confirme sua data de nascimento. Ela é armazenada de forma privada e nunca aparece no perfil.</Text><TextInput value={birthDate} onChangeText={setBirthDate} placeholder="Data de nascimento · AAAA-MM-DD" placeholderTextColor={theme.muted} style={styles.input} keyboardType="numbers-and-punctuation" /><Text style={styles.caption}>{compliance?.email ? `E-mail da identidade: ${compliance.email}` : "É necessário entrar com uma identidade OAuth que tenha e-mail pessoal confirmado."}</Text><Pressable disabled={complianceWorking || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate) || !compliance?.emailVerified} style={[styles.primary, (complianceWorking || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate) || !compliance?.emailVerified) && styles.disabled]} onPress={() => void saveCompliance()}><Text style={styles.primaryText}>{complianceWorking ? "CONFIRMANDO…" : "CONFIRMAR E CONTINUAR"}</Text></Pressable></View><Text style={styles.complianceNotice}>O CENA não usa sua data de nascimento para publicidade, recomendação ou exibição pública. A confirmação independente por link de e-mail será adicionada quando o provedor de envio transacional for configurado.</Text>{message ? <Text style={styles.error}>{message}</Text> : null}</Screen>;

  return <Screen><View style={styles.header}><View><Text style={styles.kicker}>CENA · CONTA</Text><Text style={styles.title}>{auth.user.name || "Sua conta"}</Text><Text style={styles.body}>{auth.user.email || "Sessão protegida no aparelho."}</Text></View><Pressable onPress={() => void auth.signOut()}><Text style={styles.link}>SAIR</Text></Pressable></View>
    {auth.user.accountType === "artist" ? <>
      <View style={styles.creatorHero}><Text style={styles.kicker}>CENTRO DO CRIADOR</Text><Text style={styles.sectionTitle}>{profile?.name || "Seu catálogo"}</Text><Text style={styles.body}>{profile?.handle || "Configure seu perfil no site"} · {profile?.profileType || "artista"}</Text><Text style={styles.body}>Aqui ficam suas músicas, agenda, apoio externo e leitura agregada da cena. Dados individuais de ouvintes não são exibidos.</Text><View style={styles.row}><Pressable style={styles.outline} onPress={() => profile?.supportUrl && void Linking.openURL(profile.supportUrl)}><Text style={styles.outlineText}>APOIO EXTERNO</Text></Pressable><Pressable style={styles.outline} onPress={() => profile?.pixUrl && void Linking.openURL(profile.pixUrl)}><Text style={styles.outlineText}>PIX</Text></Pressable></View></View>
      {loadingCreator ? <Text style={styles.muted}>Atualizando seu centro…</Text> : null}
      <View style={styles.card}><Text style={styles.cardTitle}>{profile ? "Editar perfil público" : "Criar perfil público"}</Text><Text style={styles.caption}>{profile ? "Atualize as informações visíveis para a comunidade." : "Preencha os dados para publicar seu perfil de artista no CENA."}</Text><TextInput value={profileName} onChangeText={setProfileName} placeholder="Nome artístico, banda ou coletivo" placeholderTextColor={theme.muted} style={styles.input} /><TextInput value={profileHandle} onChangeText={setProfileHandle} placeholder="Identificador sem @" placeholderTextColor={theme.muted} style={styles.input} autoCapitalize="none" /><TextInput value={profileType} onChangeText={setProfileType} placeholder="Tipo: solo, banda, coletivo, bar, zine…" placeholderTextColor={theme.muted} style={styles.input} autoCapitalize="none" /><TextInput value={profileGenre} onChangeText={setProfileGenre} placeholder="Gêneros ou estilo personalizado" placeholderTextColor={theme.muted} style={styles.input} /><TextInput value={profileBio} onChangeText={setProfileBio} placeholder="Bio curta" placeholderTextColor={theme.muted} style={[styles.input, styles.multiline]} multiline textAlignVertical="top" /><TextInput value={profileManifesto} onChangeText={setProfileManifesto} placeholder="Manifesto da cena (opcional)" placeholderTextColor={theme.muted} style={[styles.input, styles.multiline]} multiline textAlignVertical="top" /><TextInput value={profilePixUrl} onChangeText={setProfilePixUrl} placeholder="Pix ou chave informada" placeholderTextColor={theme.muted} style={styles.input} autoCapitalize="none" /><TextInput value={profileSupportUrl} onChangeText={setProfileSupportUrl} placeholder="Link Apoia-se/apoio externo" placeholderTextColor={theme.muted} style={styles.input} autoCapitalize="none" /><TextInput value={profileMerchUrl} onChangeText={setProfileMerchUrl} placeholder="Link de merchandise" placeholderTextColor={theme.muted} style={styles.input} autoCapitalize="none" /><TextInput value={profileInstagramUrl} onChangeText={setProfileInstagramUrl} placeholder="Instagram (URL)" placeholderTextColor={theme.muted} style={styles.input} autoCapitalize="none" /><TextInput value={profileBandcampUrl} onChangeText={setProfileBandcampUrl} placeholder="Bandcamp (URL)" placeholderTextColor={theme.muted} style={styles.input} autoCapitalize="none" /><Pressable disabled={working || !profileName.trim() || !profileHandle.trim()} style={[styles.primary, (working || !profileName.trim() || !profileHandle.trim()) && styles.disabled]} onPress={() => void saveProfile()}><Text style={styles.primaryText}>{working ? "SALVANDO…" : profile ? "SALVAR ALTERAÇÕES" : "CRIAR PERFIL"}</Text></Pressable></View>
      <View style={styles.card}><Text style={styles.cardTitle}>Métricas agregadas</Text><View style={styles.metrics}><Metric label="ESCUTAS" value={stats?.plays ?? 0} /><Metric label="ÚLTIMOS 30 DIAS" value={stats?.playsLast30Days ?? 0} /><Metric label="OUVINTES ÚNICOS" value={stats?.uniqueListeners ?? 0} /><Metric label="SEGUIDORES" value={stats?.followers ?? 0} /></View><Text style={styles.caption}>Cidades só aparecem quando há pelo menos cinco ouvintes agregados.</Text></View>
      <View style={styles.card}><Text style={styles.cardTitle}>Catálogo de músicas</Text>{tracks.length ? tracks.map(track => <View key={track.id} style={styles.listRow}><View style={styles.flex}><Text style={styles.itemTitle}>{track.title}</Text><Text style={styles.caption}>{track.genre || "Sem gênero"} · {statusLabel[track.moderationStatus] || track.moderationStatus}</Text></View><Text style={track.moderationStatus === "published" ? styles.good : styles.warning}>{track.moderationStatus === "published" ? "ATIVA" : "VER"}</Text></View>) : <Text style={styles.body}>Nenhuma faixa cadastrada ainda.</Text>}</View>
      <View style={styles.card}><Text style={styles.cardTitle}>Agenda e interessados</Text>{events.length ? events.map(event => <View key={event.id} style={styles.listRow}><View style={styles.flex}><Text style={styles.itemTitle}>{event.name || event.title}</Text><Text style={styles.caption}>{event.venue || event.place || "Local a confirmar"} · {formatDate(event.eventDate)}{event.canceledAt ? " · CANCELADO" : ""}</Text></View><View style={styles.row}><Text style={event.canceledAt ? styles.warning : styles.good}>{event.interest || 0} interessados</Text>{!event.canceledAt ? <><Pressable onPress={() => editEvent(event)}><Text style={styles.link}>EDITAR</Text></Pressable><Pressable onPress={() => cancelEvent(event)}><Text style={styles.warning}>CANCELAR</Text></Pressable></> : null}<Pressable onPress={() => removeEvent(event)}><Text style={styles.danger}>EXCLUIR</Text></Pressable></View></View>) : <Text style={styles.body}>Nenhum evento na agenda.</Text>}<TextInput value={eventName} onChangeText={setEventName} placeholder="Nome do evento" placeholderTextColor={theme.muted} style={styles.input} /><TextInput value={eventVenue} onChangeText={setEventVenue} placeholder="Casa, espaço ou local" placeholderTextColor={theme.muted} style={styles.input} /><TextInput value={eventDate} onChangeText={setEventDate} placeholder="Data/hora: 2026-12-10T20:00" placeholderTextColor={theme.muted} style={styles.input} autoCapitalize="none" /><TextInput value={eventDescription} onChangeText={setEventDescription} placeholder="Descrição curta (opcional)" placeholderTextColor={theme.muted} style={styles.input} /><TextInput value={eventTicketUrl} onChangeText={setEventTicketUrl} placeholder="URL externa de ingresso (opcional)" placeholderTextColor={theme.muted} style={styles.input} autoCapitalize="none" /><View style={styles.row}><Pressable disabled={working || !eventName.trim() || !eventVenue.trim() || !eventDate.trim()} style={[styles.primary, styles.flex, (working || !eventName.trim() || !eventVenue.trim() || !eventDate.trim()) && styles.disabled]} onPress={() => void saveEvent()}><Text style={styles.primaryText}>{eventEditingId ? "SALVAR EVENTO" : "CRIAR EVENTO"}</Text></Pressable>{eventEditingId ? <Pressable style={styles.outline} onPress={resetEventForm}><Text style={styles.outlineText}>CANCELAR</Text></Pressable> : null}</View></View>
      <View style={styles.card}><Text style={styles.cardTitle}>Merchandise informativo</Text><Text style={styles.body}>O CENA não processa checkout. Use um link externo para venda ou encomenda.</Text>{merch.map(item => <View key={item.id} style={styles.listRow}><View style={styles.flex}><Text style={styles.itemTitle}>{item.title}</Text><Text style={styles.caption}>R$ {item.price} · {item.stock} em estoque</Text></View><View style={styles.row}><Pressable onPress={() => editMerch(item)}><Text style={styles.link}>EDITAR</Text></Pressable><Pressable onPress={() => item.externalUrl && void Linking.openURL(item.externalUrl)}><Text style={styles.link}>ABRIR</Text></Pressable><Pressable onPress={() => removeMerch(item)}><Text style={styles.danger}>EXCLUIR</Text></Pressable></View></View>)}<TextInput value={merchTitle} onChangeText={setMerchTitle} placeholder="Nome do item" placeholderTextColor={theme.muted} style={styles.input} /><TextInput value={merchPrice} onChangeText={setMerchPrice} placeholder="Preço (ex.: 80,00)" placeholderTextColor={theme.muted} style={styles.input} keyboardType="decimal-pad" /><TextInput value={merchStock} onChangeText={setMerchStock} placeholder="Estoque informativo" placeholderTextColor={theme.muted} style={styles.input} keyboardType="number-pad" /><TextInput value={merchUrl} onChangeText={setMerchUrl} placeholder="URL externa (opcional)" placeholderTextColor={theme.muted} style={styles.input} autoCapitalize="none" /><Pressable disabled={working || !merchTitle.trim() || !merchPrice.trim()} style={[styles.primary, (working || !merchTitle.trim() || !merchPrice.trim()) && styles.disabled]} onPress={() => void saveMerch()}><Text style={styles.primaryText}>{editingMerchId ? "SALVAR MERCHANDISE" : "ADICIONAR MERCHANDISE"}</Text></Pressable></View>
    </> : <View style={styles.card}><Text style={styles.cardTitle}>Preferências de ouvinte</Text><Text style={styles.body}>Essas informações ficam na sua conta e não criam um perfil público. Para publicar faixas, criar agenda e acessar métricas, ative um perfil de artista.</Text><TextInput value={listenerCity} onChangeText={setListenerCity} placeholder="Cidade, UF" placeholderTextColor={theme.muted} style={styles.input} /><TextInput value={listenerGenres} onChangeText={setListenerGenres} placeholder="Gêneros favoritos" placeholderTextColor={theme.muted} style={styles.input} /><TextInput value={listenerBio} onChangeText={setListenerBio} placeholder="Bio privada opcional" placeholderTextColor={theme.muted} style={[styles.input, styles.multiline]} multiline textAlignVertical="top" /><Pressable disabled={working || !listenerCity.trim()} style={[styles.primary, (working || !listenerCity.trim()) && styles.disabled]} onPress={() => void saveListener()}><Text style={styles.primaryText}>{working ? "SALVANDO…" : "SALVAR PREFERÊNCIAS"}</Text></Pressable></View>}
    {auth.user.accountType === "artist" ? <View style={styles.card}><Text style={styles.cardTitle}>Publicar uma faixa</Text><Text style={styles.body}>Envie áudio e capa pelo storage oficial. Rascunho persistente e processamento ainda serão adicionados em uma evolução posterior.</Text><TextInput value={title} onChangeText={setTitle} placeholder="Título da faixa" placeholderTextColor={theme.muted} style={styles.input} /><TextInput value={genre} onChangeText={setGenre} placeholder="Gênero (opcional)" placeholderTextColor={theme.muted} style={styles.input} /><TextInput value={lyrics} onChangeText={setLyrics} placeholder="Letra (opcional)" placeholderTextColor={theme.muted} style={[styles.input, styles.multiline]} multiline textAlignVertical="top" /><Pressable style={styles.fileButton} onPress={() => void pick("audio")}><Text style={styles.fileText}>{audio ? `ÁUDIO · ${audio.name}` : "ESCOLHER ÁUDIO · MP3, WAV, M4A OU OGG"}</Text></Pressable><Pressable style={styles.fileButton} onPress={() => void pick("image")}><Text style={styles.fileText}>{cover ? `CAPA · ${cover.name}` : "ESCOLHER CAPA · OPCIONAL"}</Text></Pressable><Pressable style={styles.checkRow} onPress={() => setRights(value => !value)}><View style={[styles.checkbox, rights && styles.checkboxActive]} /><Text style={styles.body}>Confirmo que tenho autorização para publicar este áudio e esta capa.</Text></Pressable><Pressable disabled={working || !audio || !title.trim() || !rights} style={[styles.primary, (working || !audio || !title.trim() || !rights) && styles.disabled]} onPress={() => void publish()}><Text style={styles.primaryText}>{working ? "ENVIANDO…" : "PUBLICAR FAIXA"}</Text></Pressable></View> : null}
    {message ? <Text style={/^(Perfil|Evento|Merchandise|Faixa|Maioridade|Preferências)/.test(message) ? styles.success : styles.error}>{message}</Text> : null}</Screen>;
}

function Metric({ label, value }: { label: string; value: number }) { return <View style={styles.metric}><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>; }

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", gap: 12 }, kicker: { color: theme.coral, fontSize: 10, fontWeight: "900", letterSpacing: 1.4 }, title: { color: theme.text, fontSize: 29, lineHeight: 33, fontWeight: "900", marginTop: 7 }, sectionTitle: { color: theme.text, fontSize: 23, fontWeight: "900", marginTop: 8 }, body: { color: theme.muted, fontSize: 12, lineHeight: 18, marginTop: 8 }, muted: { color: theme.muted }, caption: { color: theme.muted, fontSize: 10, lineHeight: 15, marginTop: 4 }, link: { color: theme.coral, fontSize: 10, fontWeight: "900", letterSpacing: 1 }, danger: { color: theme.rose, fontSize: 9, fontWeight: "900", letterSpacing: 0.5 }, card: { backgroundColor: theme.surface, borderColor: theme.line, borderWidth: 1, borderRadius: 16, padding: 15, gap: 11 }, complianceCard: { backgroundColor: theme.surface, borderColor: theme.coral, borderWidth: 1, borderRadius: 16, padding: 15, gap: 11 }, complianceNotice: { color: theme.muted, fontSize: 10, lineHeight: 15 }, creatorHero: { backgroundColor: theme.surfaceRaised, borderColor: theme.coral, borderWidth: 1, borderRadius: 16, padding: 15, gap: 4 }, cardTitle: { color: theme.text, fontSize: 19, fontWeight: "900" }, input: { minHeight: 46, borderBottomWidth: 1, borderBottomColor: theme.line, color: theme.text, fontSize: 14, paddingHorizontal: 4 }, multiline: { minHeight: 100, paddingTop: 12 }, fileButton: { borderWidth: 1, borderColor: theme.line, borderRadius: 11, padding: 13, backgroundColor: theme.surfaceRaised }, fileText: { color: theme.coral, fontSize: 10, fontWeight: "900", letterSpacing: 0.5 }, checkRow: { flexDirection: "row", gap: 10, alignItems: "center" }, checkbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 1, borderColor: theme.line }, checkboxActive: { backgroundColor: theme.coral, borderColor: theme.coral }, primary: { minHeight: 48, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: theme.coral, paddingHorizontal: 16 }, primaryText: { color: theme.background, fontSize: 11, fontWeight: "900", letterSpacing: 0.8 }, outline: { minHeight: 38, borderRadius: 10, borderWidth: 1, borderColor: theme.coral, justifyContent: "center", paddingHorizontal: 12 }, outlineText: { color: theme.coral, fontSize: 9, fontWeight: "900", letterSpacing: 0.5 }, row: { flexDirection: "row", gap: 10, alignItems: "center", flexWrap: "wrap" }, metrics: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, metric: { width: "47%", backgroundColor: theme.surfaceRaised, borderRadius: 10, padding: 10 }, metricValue: { color: theme.text, fontSize: 20, fontWeight: "900" }, metricLabel: { color: theme.muted, fontSize: 8, fontWeight: "900", letterSpacing: 0.5, marginTop: 3 }, listRow: { flexDirection: "row", justifyContent: "space-between", gap: 10, borderTopWidth: 1, borderTopColor: theme.line, paddingTop: 10 }, flex: { flex: 1 }, itemTitle: { color: theme.text, fontSize: 13, fontWeight: "800" }, good: { color: theme.coral, fontSize: 9, fontWeight: "900", textAlign: "right" }, warning: { color: theme.rose, fontSize: 9, fontWeight: "900" }, disabled: { opacity: 0.4 }, error: { color: theme.rose, fontSize: 12, lineHeight: 17 }, success: { color: theme.coral, fontSize: 12, lineHeight: 17 },
});
