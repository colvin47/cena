export type SceneTrack = {
  id: number;
  title: string;
  artist: string;
  artistId: number;
  genre: string;
  city: string;
  duration: number;
  cover: string;
  accent: string;
  audioUrl?: string;
};

export type SceneArtist = {
  id: number;
  name: string;
  handle: string;
  genre: string;
  bio: string;
  city: string;
  image: string;
  accent: string;
  followers: string;
  instagramUrl?: string;
  bandcampUrl?: string;
};

export type SceneEvent = {
  id: number;
  day: string;
  month: string;
  title: string;
  place: string;
  city: string;
  time: string;
  description: string;
  color: "lime" | "coral" | "lavender";
  interest: number;
  artistId: number;
  isoDate?: string;
  ticketUrl?: string;
};

export const sceneTracks: SceneTrack[] = [
  { id: 1, title: "Fica Mais Um", artist: "Lume Azul", artistId: 1, genre: "Alt pop", city: "Campinas", duration: 218, cover: "/manus-storage/async-images/zECBu6e1TAHTM0U2AqQeOw/image-1.webp", accent: "#c8f36a", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { id: 2, title: "Parque Industrial", artist: "Teto Baixo", artistId: 2, genre: "Indie rock", city: "Campinas", duration: 248, cover: "/manus-storage/async-images/zECBu6e1TAHTM0U2AqQeOw/image-2.webp", accent: "#ff765f", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { id: 3, title: "Sete Esquinas", artist: "Vértice", artistId: 3, genre: "Eletrônico", city: "Campinas", duration: 176, cover: "/manus-storage/async-images/zECBu6e1TAHTM0U2AqQeOw/image-3.webp", accent: "#a69aff", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
  { id: 4, title: "Vento Sul", artist: "Brisa Funda", artistId: 4, genre: "MPB", city: "Campinas", duration: 211, cover: "/manus-storage/async-images/zECBu6e1TAHTM0U2AqQeOw/image-1.webp", accent: "#f0bd74", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" },
  { id: 5, title: "Quase Domingo", artist: "Lume Azul", artistId: 1, genre: "Alt pop", city: "Campinas", duration: 194, cover: "/manus-storage/async-images/zECBu6e1TAHTM0U2AqQeOw/image-2.webp", accent: "#c8f36a", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
];

export const sceneArtists: SceneArtist[] = [
  { id: 1, name: "Lume Azul", handle: "@lumeazul", genre: "Alt pop / synth", city: "Campinas, SP", bio: "Canções de pista vazia, synths brilhando e aquele refrão que chega antes da gente.", image: "/manus-storage/async-images/zECBu6e1TAHTM0U2AqQeOw/image-1.webp", accent: "#c8f36a", followers: "2,8 mil", instagramUrl: "https://instagram.com" },
  { id: 2, name: "Teto Baixo", handle: "@tetobaixo", genre: "Indie rock", city: "Campinas, SP", bio: "Guitarras de garagem e histórias de quem pega o último ônibus.", image: "/manus-storage/async-images/zECBu6e1TAHTM0U2AqQeOw/image-2.webp", accent: "#ff765f", followers: "1,6 mil", instagramUrl: "https://instagram.com" },
  { id: 3, name: "Vértice", handle: "@vertice404", genre: "Eletrônico", city: "Campinas, SP", bio: "Batidas tortas para dançar no centro da cidade.", image: "/manus-storage/async-images/zECBu6e1TAHTM0U2AqQeOw/image-3.webp", accent: "#a69aff", followers: "980", bandcampUrl: "https://bandcamp.com" },
  { id: 4, name: "Brisa Funda", handle: "@brisafunda", genre: "MPB / groove", city: "Campinas, SP", bio: "Som de varanda, voz próxima e grooves para desacelerar.", image: "/manus-storage/async-images/zECBu6e1TAHTM0U2AqQeOw/image-4.webp", accent: "#f0bd74", followers: "1,2 mil", instagramUrl: "https://instagram.com" },
];

export const sceneEvents: SceneEvent[] = [
  { id: 1, day: "08", month: "NOV", title: "Festival Vira-Lata", place: "Casa Mirante", city: "Campinas", time: "18:00", description: "Uma noite inteira de bandas independentes, comida de rua e vinil no quintal.", color: "lime", interest: 312, artistId: 1, isoDate: "2026-11-08T18:00:00-03:00" },
  { id: 2, day: "09", month: "NOV", title: "Noite Baixa Vol. 3", place: "Goma Bar", city: "Campinas", time: "20:30", description: "Teto Baixo, Brisa Funda e convidados no palco mais apertado da cidade.", color: "coral", interest: 186, artistId: 2, isoDate: "2026-11-09T20:30:00-03:00" },
  { id: 3, day: "15", month: "NOV", title: "Som no Quintal", place: "Estação Cultura", city: "Campinas", time: "16:00", description: "Feira de selos, discotecagem e shows ao pôr do sol.", color: "lavender", interest: 94, artistId: 4, isoDate: "2026-11-15T16:00:00-03:00" },
]; 

export const sceneGenres = ["Tudo", "Alt pop", "Indie rock", "Eletrônico", "MPB", "Hip hop"];

export const scenePlaylists = [
  { id: 1, name: "Campinas depois das seis", owner: "Cena editorial", collaborative: true, tracks: [1, 3, 5], description: "Uma volta pelo som local quando as luzes acendem." },
  { id: 2, name: "Cambuí em câmera lenta", owner: "Marina V.", collaborative: false, tracks: [4, 1], description: "Groove, synth e calçada quente." },
];

export const sceneActivity = [
  { id: 1, kind: "release", title: "Lume Azul lançou Quase Domingo", time: "há 2h", accent: "#c8f36a", artistId: 1 },
  { id: 2, kind: "event", title: "Brisa Funda confirmou show no Estação Cultura", time: "ontem", accent: "#f0bd74", artistId: 4 },
  { id: 3, kind: "playlist", title: "Você salvou Campinas depois das seis", time: "há 3 dias", accent: "#a69aff", artistId: 1 },
];
