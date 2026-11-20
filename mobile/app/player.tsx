import { useState } from "react";
import { Image, LayoutChangeEvent, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "@/components/Screen";
import { theme } from "@/components/theme";
import { absoluteMediaUrl } from "@/lib/cena-api";
import { useCenaAudio } from "@/hooks/CenaAudio";

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const value = Math.floor(seconds);
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, "0")}`;
}

export default function PlayerScreen() {
  const router = useRouter();
  const audio = useCenaAudio();
  const track = audio.currentTrack;
  const [timelineWidth, setTimelineWidth] = useState(1);
  if (!track) {
    return <Screen><Text style={styles.empty}>Escolha uma faixa para abrir o player.</Text></Screen>;
  }
  const cover = absoluteMediaUrl(track.cover || track.coverUrl);
  const progress = audio.duration > 0 ? Math.min(1, audio.currentTime / audio.duration) : 0;
  const onTimelineLayout = (event: LayoutChangeEvent) => setTimelineWidth(Math.max(1, event.nativeEvent.layout.width));
  const seekFromPress = (locationX: number) => audio.seekTo((locationX / timelineWidth) * audio.duration);

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.topbar}><Text style={styles.kicker}>CENA · PLAYER</Text><Pressable onPress={() => router.back()} accessibilityRole="button"><Text style={styles.close}>FECHAR</Text></Pressable></View>
      {cover ? <Image source={{ uri: cover }} style={styles.artwork} /> : <View style={[styles.artwork, styles.artworkFallback]}><Text style={styles.mark}>C.</Text></View>}
      <View style={styles.heading}><Text numberOfLines={2} style={styles.title}>{track.title}</Text><Text style={styles.artist}>{track.artist}</Text><Text style={styles.meta}>{[track.album, track.genre, track.city].filter(Boolean).join(" · ")}</Text></View>
      <View style={styles.timelineBlock}><Pressable onLayout={onTimelineLayout} onPress={event => seekFromPress(event.nativeEvent.locationX)} style={styles.timeline} accessibilityRole="adjustable" accessibilityLabel="Progresso da faixa"><View style={[styles.progress, { width: `${progress * 100}%` }]} /><View style={[styles.thumb, { left: `${Math.max(0, progress * 100 - 1)}%` }]} /></Pressable><View style={styles.timeRow}><Text style={styles.time}>{formatTime(audio.currentTime)}</Text><Text style={styles.time}>{formatTime(audio.duration)}</Text></View></View>
      <View style={styles.controls}><Pressable onPress={audio.playPrevious} style={styles.secondaryControl} accessibilityRole="button" accessibilityLabel="Faixa anterior"><Text style={styles.controlText}>|◀</Text></Pressable><Pressable onPress={audio.togglePlayback} style={styles.playControl} accessibilityRole="button" accessibilityLabel={audio.playing ? "Pausar" : "Reproduzir"}><Text style={styles.playText}>{audio.buffering ? "…" : audio.playing ? "Ⅱ" : "▶"}</Text></Pressable><Pressable onPress={audio.playNext} style={styles.secondaryControl} accessibilityRole="button" accessibilityLabel="Próxima faixa"><Text style={styles.controlText}>▶|</Text></Pressable></View>
      {audio.error ? <Text style={styles.error}>{audio.error}</Text> : null}
      {track.lyrics?.trim() ? <View style={styles.lyricsCard}><Text style={styles.sectionLabel}>LETRA</Text><Text style={styles.lyrics}>{track.lyrics.trim()}</Text></View> : <View style={styles.lyricsCard}><Text style={styles.sectionLabel}>LETRA</Text><Text style={styles.body}>O artista ainda não cadastrou uma letra para esta faixa.</Text></View>}
      <Pressable onPress={() => router.push(`/track/${track.id}` as never)} style={styles.detailsButton} accessibilityRole="button"><Text style={styles.detailsText}>ABRIR DETALHES DA FAIXA</Text></Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { alignItems: "stretch", gap: 18, paddingBottom: 34 },
  topbar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  kicker: { color: theme.coral, fontSize: 10, fontWeight: "900", letterSpacing: 1.5 },
  close: { color: theme.primary, fontSize: 10, fontWeight: "900", letterSpacing: 0.8 },
  artwork: { width: "100%", aspectRatio: 1, borderRadius: 20, backgroundColor: theme.surfaceRaised },
  artworkFallback: { alignItems: "center", justifyContent: "center" },
  mark: { color: theme.primary, fontSize: 64, fontWeight: "900" },
  heading: { gap: 5 },
  title: { color: theme.text, fontSize: 27, lineHeight: 32, fontWeight: "900" },
  artist: { color: theme.primary, fontSize: 15, fontWeight: "800" },
  meta: { color: theme.muted, fontSize: 11 },
  timelineBlock: { gap: 7 },
  timeline: { height: 22, justifyContent: "center", backgroundColor: theme.surfaceRaised, borderRadius: 8, overflow: "hidden" },
  progress: { height: 4, backgroundColor: theme.primary, borderRadius: 4 },
  thumb: { position: "absolute", width: 12, height: 12, borderRadius: 6, backgroundColor: theme.coral },
  timeRow: { flexDirection: "row", justifyContent: "space-between" },
  time: { color: theme.muted, fontSize: 10, fontVariant: ["tabular-nums"] },
  controls: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 30 },
  secondaryControl: { width: 42, height: 42, alignItems: "center", justifyContent: "center" },
  controlText: { color: theme.text, fontSize: 18, fontWeight: "900" },
  playControl: { width: 62, height: 62, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: theme.coral },
  playText: { color: theme.background, fontSize: 25, fontWeight: "900" },
  lyricsCard: { backgroundColor: theme.surface, borderRadius: 16, padding: 16, gap: 10 },
  sectionLabel: { color: theme.rose, fontSize: 9, fontWeight: "900", letterSpacing: 1.2 },
  lyrics: { color: theme.text, fontSize: 15, lineHeight: 25 },
  body: { color: theme.muted, fontSize: 12, lineHeight: 18 },
  detailsButton: { minHeight: 46, borderWidth: 1, borderColor: theme.line, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  detailsText: { color: theme.primary, fontSize: 10, fontWeight: "900", letterSpacing: 0.6 },
  error: { color: theme.coral, fontSize: 11 },
  empty: { color: theme.muted },
});
