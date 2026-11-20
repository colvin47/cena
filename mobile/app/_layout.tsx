import { DarkTheme, Stack, ThemeProvider } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "react-native-reanimated";
import { CenaAudioProvider } from "@/hooks/CenaAudio";
import { LocalCityProvider } from "@/hooks/LocalCity";
import { LocalLibraryProvider } from "@/hooks/LocalLibrary";
import { MiniPlayer } from "@/components/MiniPlayer";
import { theme } from "@/components/theme";
import { CenaAuthProvider } from "@/hooks/CenaAuth";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = { anchor: "(tabs)" };

export default function RootLayout() {
  const cenaTheme = {
    ...DarkTheme,
    colors: { ...DarkTheme.colors, background: theme.background, card: theme.surface, text: theme.text, border: theme.line, primary: theme.primary },
  };

  return (
    <SafeAreaProvider>
      <LocalCityProvider>
        <CenaAuthProvider>
          <LocalLibraryProvider>
            <CenaAudioProvider>
              <ThemeProvider value={cenaTheme}>
                <StatusBar style="light" />
                <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.background } }}>
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="artist/[handle]" />
                  <Stack.Screen name="event/[id]" />
                  <Stack.Screen name="track/[id]" />
                  <Stack.Screen name="player" options={{ presentation: "modal" }} />
                  <Stack.Screen name="account" />
                <Stack.Screen name="modal" options={{ presentation: "modal" }} />
                </Stack>
                <MiniPlayer />
              </ThemeProvider>
            </CenaAudioProvider>
          </LocalLibraryProvider>
        </CenaAuthProvider>
      </LocalCityProvider>
    </SafeAreaProvider>
  );
}
