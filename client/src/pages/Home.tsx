import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  ArrowUpRight,
  Bell,
  CalendarDays,
  Check,
  ChevronRight,
  CirclePlay,
  Clock3,
  Disc3,
  Headphones,
  Heart,
  Home as HomeIcon,
  Link2,
  ListMusic,
  LogIn,
  LogOut,
  MapPin,
  Menu,
  Pause,
  Play,
  Plus,
  Radio,
  Search,
  Share2,
  SkipBack,
  SkipForward,
  Sparkles,
  Ticket,
  UploadCloud,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { sceneActivity, sceneArtists, sceneEvents, sceneGenres, scenePlaylists, sceneTracks, type SceneArtist, type SceneEvent, type SceneTrack } from "@shared/scene-seed";

type View = "home" | "search" | "events" | "library" | "profile" | "upload";

type UploadDraft = {
  title: string;
  album: string;
  genre: string;
  city: string;
  description: string;
  rights: boolean;
  audio: File | null;
  cover: File | null;
};

type ArtistDraft = {
  name: string;
  handle: string;
  city: string;
  genre: string;
  bio: string;
};

type LibrarySnapshot = {
  playlists?: Array<{ id: number; name: string; collaborative: boolean; trackIds: number[] }>;
} | null;

const fallbackContent = {
  tracks: sceneTracks,
  artists: sceneArtists,
  events: sceneEvents,
  genres: sceneGenres,
  playlists: scenePlaylists,
  activity: sceneActivity,
  source: "seed" as "seed" | "database",
};

const sceneCities = ["Campinas", "São Paulo", "Jundiaí"];

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

function initials(name: string) {
  return name.split(" ").map(word => word[0]).join("").slice(0, 2).toUpperCase();
}

function viewFromPath(path: string): View {
  if (path === "/buscar") return "search";
  if (path === "/eventos") return "events";
  if (path === "/biblioteca") return "library";
  if (path === "/perfil" || path.startsWith("/artistas/")) return "profile";
  if (path === "/enviar") return "upload";
  return "home";
}

function pathFromView(view: View) {
  return view === "home" ? "/" : `/${view === "search" ? "buscar" : view === "events" ? "eventos" : view === "library" ? "biblioteca" : view === "profile" ? "perfil" : "enviar"}`;
}

function SectionTitle({ eyebrow, title, action, onAction }: { eyebrow?: string; title: string; action?: string; onAction?: () => void }) {
  return (
    <div className="section-title">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
      </div>
      {action && <button className="text-button" onClick={onAction}>{action}<ChevronRight size={15} /></button>}
    </div>
  );
}

function EmptyState({ title, message }: { title: string; message: string }) {
  return <div className="empty-card"><Search size={22} /><strong>{title}</strong><span>{message}</span></div>;
}

function TrackRow({ track, active, playing, onPlay, onShare }: { track: SceneTrack; active: boolean; playing: boolean; onPlay: () => void; onShare: () => void }) {
  return (
    <article className={`track-row ${active ? "is-active" : ""}`}>
      <button className="track-art" style={{ "--accent": track.accent } as CSSProperties} onClick={onPlay} aria-label={`Tocar ${track.title}`}>
        <img src={track.cover} alt="" />
        <span className="track-art-overlay">{active && playing ? <Pause size={16} /> : <Play size={16} fill="currentColor" />}</span>
      </button>
      <div className="track-copy" onClick={onPlay}>
        <strong>{track.title}</strong>
        <span>{track.artist} · {track.genre}</span>
      </div>
      <span className="track-city"><MapPin size={12} />{track.city}</span>
      <span className="track-duration">{formatTime(track.duration)}</span>
      <button className="icon-button quiet" onClick={onShare} aria-label={`Compartilhar ${track.title}`}><Share2 size={16} /></button>
    </article>
  );
}

function ArtistCard({ artist, onOpen, followed, onFollow }: { artist: SceneArtist; onOpen: () => void; followed: boolean; onFollow: () => void }) {
  return (
    <article className="artist-card" style={{ "--accent": artist.accent } as CSSProperties}>
      <button className="artist-image" onClick={onOpen} aria-label={`Abrir perfil de ${artist.name}`}><img src={artist.image} alt="" /><span>{initials(artist.name)}</span></button>
      <div className="artist-card-body">
        <div><span className="card-kicker">{artist.genre}</span><h3>{artist.name}</h3><p>{artist.city}</p></div>
        <button className={`follow-button ${followed ? "is-followed" : ""}`} onClick={onFollow}>{followed ? <Check size={14} /> : <Plus size={14} />} {followed ? "Seguindo" : "Seguir"}</button>
      </div>
    </article>
  );
}

function EventCard({ event, interested, onInterest, onShare, onOpenArtist }: { event: SceneEvent; interested: boolean; onInterest: () => void; onShare: () => void; onOpenArtist: () => void }) {
  return (
    <article className={`event-card event-${event.color}`}>
      <div className="event-date"><strong>{event.day}</strong><span>{event.month}</span></div>
      <div className="event-main">
        <div className="event-meta"><span><Clock3 size={13} /> {event.time}</span><span><MapPin size={13} /> {event.city}</span></div>
        <h3>{event.title}</h3>
        <button className="event-place" onClick={onOpenArtist}>{event.place} <ArrowUpRight size={13} /></button>
        <p>{event.description}</p>
        {event.ticketUrl && <a className="event-place" href={event.ticketUrl} target="_blank" rel="noreferrer">Ingressos <Ticket size={12} /></a>}
        <div className="event-actions"><button className={`interest-button ${interested ? "is-interested" : ""}`} onClick={onInterest}>{interested ? <Check size={15} /> : <Heart size={15} />} {interested ? "Você vai" : "Tenho interesse"}</button><button className="icon-button quiet" onClick={onShare} aria-label="Compartilhar evento"><Share2 size={16} /></button></div>
      </div>
      <Ticket size={18} className="event-ticket" />
    </article>
  );
}

function HomeView({ content, activeGenre, setActiveGenre, activeCity, setActiveCity, onPlay, onOpenArtist, followed, onFollow, interested, onInterest, onShare, setView }: { content: typeof fallbackContent; activeGenre: string; setActiveGenre: (genre: string) => void; activeCity: string; setActiveCity: (city: string) => void; onPlay: (track: SceneTrack) => void; onOpenArtist: (artist: SceneArtist) => void; followed: number[]; onFollow: (id: number) => void; interested: number[]; onInterest: (id: number) => void; onShare: (label: string) => void; setView: (view: View) => void }) {
  return (
    <div className="page home-page">
      <section className="hero-block">
        <div className="hero-copy"><span className="eyebrow lime"><Radio size={13} /> AO VIVO EM CAMPINAS</span><h1>A cidade tem<br /><em>som novo.</em></h1><p>Descubra faixas, artistas e shows feitos por quem vive a cena local.</p><div className="hero-actions"><button className="primary-button" onClick={() => onPlay(content.tracks[0])}><Play size={16} fill="currentColor" /> Ouvir agora</button><button className="ghost-button" onClick={() => setView("events")}>Ver agenda <ChevronRight size={16} /></button></div></div>
        <div className="hero-art"><div className="hero-orb orb-one" /><div className="hero-orb orb-two" /><div className="hero-stamp"><span>escute<br />perto</span><Disc3 size={26} /></div><div className="hero-ticker"><span>• CENA LOCAL</span><span>• CAMPINAS, SP</span><span>• SEM ANÚNCIOS</span></div></div>
      </section>

      <section className="content-section">
        <SectionTitle eyebrow="descoberta regional" title="Em alta na sua cidade" action="Ver tudo" onAction={() => setView("search")} />
        <div className="filter-row"><label className="city-chip"><MapPin size={14} /><select value={activeCity} onChange={event => setActiveCity(event.target.value)} aria-label="Escolher cidade">{sceneCities.map(city => <option key={city}>{city}</option>)}</select><ChevronRight size={14} /></label><div className="genre-filters">{content.genres.map(genre => <button key={genre} className={activeGenre === genre ? "active" : ""} onClick={() => setActiveGenre(genre)}>{genre}</button>)}</div></div>
        <div className="track-list">{content.tracks.slice(0, 4).map((track, index) => <TrackRow key={track.id} track={track} active={index === 0} playing={false} onPlay={() => onPlay(track)} onShare={() => onShare(`Faixa ${track.title}`)} />)}</div>
      </section>

      <section className="content-section split-section"><div className="split-main"><SectionTitle eyebrow="gente que faz" title="Artistas da cena" action="Conhecer artistas" onAction={() => setView("search")} /><div className="artist-strip">{content.artists.map(artist => <ArtistCard key={artist.id} artist={artist} onOpen={() => onOpenArtist(artist)} followed={followed.includes(artist.id)} onFollow={() => onFollow(artist.id)} />)}</div></div><div className="quote-card"><Sparkles size={18} /><p>“O melhor som é aquele que você encontra a três quarteirões de casa.”</p><span>— Caderno de rua, Cambuí</span></div></section>

      <section className="content-section"><SectionTitle eyebrow="chegue antes do refrão" title="Próximos shows" action="Abrir agenda" onAction={() => setView("events")} /><div className="event-list">{content.events.map(event => <EventCard key={event.id} event={event} interested={interested.includes(event.id)} onInterest={() => onInterest(event.id)} onShare={() => onShare(`Evento ${event.title}`)} onOpenArtist={() => setView("events")} />)}</div></section>
    </div>
  );
}

function SearchView({ content, searchTerm, setSearchTerm, activeGenre, setActiveGenre, onPlay, onOpenArtist, followed, onFollow, onShare }: { content: typeof fallbackContent; searchTerm: string; setSearchTerm: (term: string) => void; activeGenre: string; setActiveGenre: (genre: string) => void; onPlay: (track: SceneTrack) => void; onOpenArtist: (artist: SceneArtist) => void; followed: number[]; onFollow: (id: number) => void; onShare: (label: string) => void }) {
  const tracks = content.tracks.filter(track => activeGenre === "Tudo" || track.genre === activeGenre);
  return <div className="page"><div className="page-intro"><span className="eyebrow">explorar</span><h1>Buscar na cena.</h1><p>Artistas, faixas, gêneros e lugares para ouvir Campinas de outro jeito.</p></div><div className="search-box"><Search size={20} /><input value={searchTerm} onChange={event => setSearchTerm(event.target.value)} placeholder="Busque por artista, faixa, gênero ou cidade" autoFocus /></div><div className="filter-row search-filters"><div className="genre-filters">{content.genres.map(genre => <button key={genre} className={activeGenre === genre ? "active" : ""} onClick={() => setActiveGenre(genre)}>{genre}</button>)}</div></div><section className="content-section"><SectionTitle title={`Faixas ${searchTerm ? `para “${searchTerm}”` : "em destaque"}`} />{tracks.length ? <div className="track-list">{tracks.map(track => <TrackRow key={track.id} track={track} active={false} playing={false} onPlay={() => onPlay(track)} onShare={() => onShare(`Faixa ${track.title}`)} />)}</div> : <EmptyState title="Nenhuma faixa encontrada." message="Tente outro termo, gênero ou cidade para continuar explorando." />}</section><section className="content-section"><SectionTitle title="Artistas" />{content.artists.length ? <div className="artist-strip">{content.artists.map(artist => <ArtistCard key={artist.id} artist={artist} onOpen={() => onOpenArtist(artist)} followed={followed.includes(artist.id)} onFollow={() => onFollow(artist.id)} />)}</div> : <EmptyState title="Nenhum artista encontrado." message="Ainda não há esse projeto no radar da sua cidade." />}</section></div>;
}

function EventsView({ content, interested, onInterest, onShare, onCreateEvent, isArtist }: { content: typeof fallbackContent; interested: number[]; onInterest: (id: number) => void; onShare: (label: string) => void; onCreateEvent: (draft: { name: string; venue: string; city: string; eventDate: string; description: string; ticketUrl?: string }) => void; isArtist: boolean }) {
  const [showComposer, setShowComposer] = useState(false);
  const [dateFilter, setDateFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("Todas");
  const [draft, setDraft] = useState({ name: "", venue: "", city: "Campinas", eventDate: "", description: "", ticketUrl: "" });
  const cities = ["Todas", ...Array.from(new Set(content.events.map(event => event.city)))];
  const filteredEvents = content.events.filter(event => {
    if (cityFilter !== "Todas" && event.city !== cityFilter) return false;
    if (dateFilter === "all" || !event.isoDate) return true;
    const days = (new Date(event.isoDate).getTime() - Date.now()) / 86_400_000;
    return days >= -1 && days <= Number(dateFilter);
  });
  return <div className="page"><div className="page-intro page-intro-row"><div><span className="eyebrow">agenda local</span><h1>Onde a cena se encontra.</h1><p>Shows, feiras e noites que merecem sair de casa.</p></div>{isArtist && <button className="primary-button" onClick={() => setShowComposer(value => !value)}><Plus size={16} /> Criar evento</button>}</div>{showComposer && <form className="composer-card" onSubmit={event => { event.preventDefault(); onCreateEvent(draft); setShowComposer(false); }}><div className="composer-heading"><div><span className="eyebrow">artista</span><h2>Coloque seu show na agenda.</h2></div><button type="button" className="icon-button" onClick={() => setShowComposer(false)}><X size={18} /></button></div><div className="form-grid"><label>Nome do evento<input required value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })} placeholder="Festival, show, sessão..." /></label><label>Local<input required value={draft.venue} onChange={event => setDraft({ ...draft, venue: event.target.value })} placeholder="Nome da casa" /></label><label>Cidade<input required value={draft.city} onChange={event => setDraft({ ...draft, city: event.target.value })} /></label><label>Data e hora<input required type="datetime-local" value={draft.eventDate} onChange={event => setDraft({ ...draft, eventDate: event.target.value })} /></label></div><label>Descrição<textarea value={draft.description} onChange={event => setDraft({ ...draft, description: event.target.value })} placeholder="O que acontece nessa noite?" /></label><label>Link de ingresso<input type="url" value={draft.ticketUrl} onChange={event => setDraft({ ...draft, ticketUrl: event.target.value })} placeholder="https://... (opcional)" /></label><button className="primary-button" type="submit">Publicar na agenda <ArrowUpRight size={16} /></button></form>}<div className="event-filters"><span className="eyebrow">filtrar agenda</span><select value={cityFilter} onChange={event => setCityFilter(event.target.value)}>{cities.map(city => <option key={city}>{city}</option>)}</select><select value={dateFilter} onChange={event => setDateFilter(event.target.value)}><option value="all">Todas as datas</option><option value="7">Próximos 7 dias</option><option value="30">Próximos 30 dias</option></select></div><div className="event-list event-page-list">{filteredEvents.map(event => <EventCard key={event.id} event={event} interested={interested.includes(event.id)} onInterest={() => onInterest(event.id)} onShare={() => onShare(`Evento ${event.title}`)} onOpenArtist={() => undefined} />)}</div></div>;
}

function LibraryView({ content, followed, onPlay, onOpenArtist, onCreatePlaylist, isAuthenticated, library }: { content: typeof fallbackContent; followed: number[]; onPlay: (track: SceneTrack) => void; onOpenArtist: (artist: SceneArtist) => void; onCreatePlaylist: () => void; isAuthenticated: boolean; library: LibrarySnapshot | undefined }) {
  const followedArtists = content.artists.filter(artist => followed.includes(artist.id));
  const playlists = library?.playlists?.length ? library.playlists.map(playlist => ({ ...playlist, owner: "Você", description: playlist.collaborative ? "Aberta para a sua comunidade adicionar faixas." : "Sua rota pessoal pela cidade.", tracks: playlist.trackIds })) : content.playlists;
  return <div className="page"><div className="page-intro page-intro-row"><div><span className="eyebrow">seu canto</span><h1>Biblioteca.</h1><p>O que você guardou, seguiu e quer ouvir de novo.</p></div><button className="primary-button" onClick={onCreatePlaylist}><Plus size={16} /> Nova playlist</button></div><section className="content-section"><SectionTitle title="Atividade" /><div className="activity-list">{content.activity.map(item => <div className="activity-item" key={item.id}><span className="activity-icon" style={{ background: item.accent }} /> <div><strong>{item.title}</strong><span>{item.time}</span></div><ArrowUpRight size={15} /></div>)}</div></section><section className="content-section"><SectionTitle title={library?.playlists?.length ? "Suas playlists" : "Playlists seed"} /><div className="playlist-strip">{playlists.map(playlist => <article className="playlist-card" key={playlist.id}><div className="playlist-collage"><span style={{ background: "#c8f36a" }} /><span style={{ background: "#ff765f" }} /><span style={{ background: "#a69aff" }} /><ListMusic size={22} /></div><span className="card-kicker">{playlist.collaborative ? "colaborativa" : "playlist local"}</span><h3>{playlist.name}</h3><p>{playlist.description}</p><small>{playlist.owner} · {playlist.tracks.length} faixas</small></article>)}</div></section><section className="content-section"><SectionTitle title="Artistas seguidos" />{followedArtists.length ? <div className="artist-strip">{followedArtists.map(artist => <ArtistCard key={artist.id} artist={artist} onOpen={() => onOpenArtist(artist)} followed onFollow={() => undefined} />)}</div> : <div className="empty-card"><Heart size={22} /><strong>Você ainda não segue ninguém.</strong><span>Descubra artistas da sua cidade e monte seu próprio radar.</span></div>}</section>{!isAuthenticated && <div className="login-callout"><LogIn size={20} /><div><strong>Entre para guardar sua cena.</strong><span>Follows, playlists e interesses ficam com você em qualquer tela.</span></div></div>}</div>;
}

function ArtistProfile({ artist, content, followed, onFollow, onPlay, onShare }: { artist: SceneArtist; content: typeof fallbackContent; followed: boolean; onFollow: () => void; onPlay: (track: SceneTrack) => void; onShare: (label: string) => void }) {
  const artistTracks = content.tracks.filter(track => track.artistId === artist.id);
  const artistEvents = content.events.filter(event => event.artistId === artist.id);
  return <div className="page artist-profile-page"><div className="artist-cover" style={{ "--accent": artist.accent } as CSSProperties}><img src={artist.image} alt="" /><div className="artist-cover-shade" /><span className="artist-cover-label">{artist.city}</span></div><div className="artist-profile-head"><div><span className="eyebrow">{artist.handle} · {artist.genre}</span><h1>{artist.name}</h1><p>{artist.bio}</p></div><div className="profile-actions"><button className={`follow-button large ${followed ? "is-followed" : ""}`} onClick={onFollow}>{followed ? <Check size={15} /> : <Plus size={15} />} {followed ? "Seguindo" : "Seguir"}</button><button className="icon-button" onClick={() => onShare(`Perfil de ${artist.name}`)}><Share2 size={17} /></button></div></div><section className="content-section"><SectionTitle eyebrow="faixas" title={`O som de ${artist.name}`} /><div className="track-list">{artistTracks.map(track => <TrackRow key={track.id} track={track} active={false} playing={false} onPlay={() => onPlay(track)} onShare={() => onShare(`Faixa ${track.title}`)} />)}</div></section>{artistEvents.length > 0 && <section className="content-section"><SectionTitle eyebrow="agenda" title="Próximos shows" /><div className="event-list event-page-list">{artistEvents.map(event => <EventCard key={event.id} event={event} interested={false} onInterest={() => undefined} onShare={() => onShare(`Evento ${event.title}`)} onOpenArtist={() => undefined} />)}</div></section>}<section className="profile-links"><span><Users size={15} /> {artist.followers} ouvintes</span>{artist.instagramUrl && <a href={artist.instagramUrl} target="_blank" rel="noreferrer">Instagram <ArrowUpRight size={13} /></a>}{artist.bandcampUrl && <a href={artist.bandcampUrl} target="_blank" rel="noreferrer">Bandcamp <ArrowUpRight size={13} /></a>}</section></div>;
}

function UploadView({ draft, setDraft, onSubmit, isArtist }: { draft: UploadDraft; setDraft: (draft: UploadDraft) => void; onSubmit: () => void; isArtist: boolean }) {
  return <div className="page"><div className="page-intro"><span className="eyebrow">selo aberto</span><h1>Seu som merece<br /><em>um lugar na cidade.</em></h1><p>Envie uma faixa, conte de onde ela vem e deixe a cena encontrar você.</p></div><form className="upload-form" onSubmit={event => { event.preventDefault(); onSubmit(); }}><div className="upload-drop"><UploadCloud size={26} /><strong>{draft.audio ? draft.audio.name : "Escolha o arquivo de áudio"}</strong><span>MP3, WAV, M4A ou OGG · até 50 MB</span><input required type="file" accept="audio/*" onChange={event => setDraft({ ...draft, audio: event.target.files?.[0] ?? null })} /></div><div className="form-grid"><label>Título da faixa<input required value={draft.title} onChange={event => setDraft({ ...draft, title: event.target.value })} placeholder="Como ela se chama?" /></label><label>Álbum ou projeto<input value={draft.album} onChange={event => setDraft({ ...draft, album: event.target.value })} placeholder="Opcional" /></label><label>Gênero<select value={draft.genre} onChange={event => setDraft({ ...draft, genre: event.target.value })}>{sceneGenres.filter(genre => genre !== "Tudo").map(genre => <option key={genre}>{genre}</option>)}</select></label><label>Cidade<input required value={draft.city} onChange={event => setDraft({ ...draft, city: event.target.value })} /></label></div><label>Descrição<textarea value={draft.description} onChange={event => setDraft({ ...draft, description: event.target.value })} placeholder="Uma frase sobre essa faixa" /></label><label className="cover-input">Capa <input type="file" accept="image/*" onChange={event => setDraft({ ...draft, cover: event.target.files?.[0] ?? null })} /></label><label className="rights-check"><input type="checkbox" checked={draft.rights} onChange={event => setDraft({ ...draft, rights: event.target.checked })} /><span><strong>Declaro que tenho os direitos.</strong> Confirmo que sou o artista ou representante autorizado do áudio e da imagem enviados. A Cena pode hospedar e reproduzir este conteúdo conforme os termos de uso.</span></label><button className="primary-button" type="submit" disabled={!isArtist || !draft.rights}><UploadCloud size={16} /> {isArtist ? "Enviar para a Cena" : "Entre como artista para enviar"}</button></form></div>;
}

function ArtistSetupView({ draft, setDraft, onSubmit, isSaving }: { draft: ArtistDraft; setDraft: (draft: ArtistDraft) => void; onSubmit: () => void; isSaving: boolean }) {
  return <form className="composer-card artist-setup-card" onSubmit={event => { event.preventDefault(); onSubmit(); }}><div className="composer-heading"><div><span className="eyebrow lime">primeiro passo</span><h2>Apresente seu projeto.</h2><p>Seu perfil é a porta de entrada para faixas, shows e novos ouvintes.</p></div></div><div className="form-grid"><label>Nome artístico<input required minLength={2} value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })} placeholder="Como a cidade conhece você?" /></label><label>@ do projeto<input required pattern="@?[A-Za-z0-9_]+" value={draft.handle} onChange={event => setDraft({ ...draft, handle: event.target.value })} placeholder="lumeazul" /></label><label>Cidade<input required value={draft.city} onChange={event => setDraft({ ...draft, city: event.target.value })} placeholder="Campinas" /></label><label>Gênero<input value={draft.genre} onChange={event => setDraft({ ...draft, genre: event.target.value })} placeholder="Indie pop" /></label></div><label>Bio<textarea value={draft.bio} onChange={event => setDraft({ ...draft, bio: event.target.value })} placeholder="Conte em poucas linhas de onde vem o seu som." maxLength={1000} /></label><button className="primary-button" type="submit" disabled={isSaving}>{isSaving ? "Salvando perfil..." : "Criar perfil de artista"} <ArrowUpRight size={16} /></button></form>;
}

function Player({ track, isPlaying, onToggle, onNext, onPrevious, progress, duration, onSeek }: { track: SceneTrack; isPlaying: boolean; onToggle: () => void; onNext: () => void; onPrevious: () => void; progress: number; duration: number; onSeek: (value: number) => void }) {
  return <footer className={`scene-player ${isPlaying ? "is-playing" : ""}`}><div className="player-track"><img src={track.cover} alt="" /><div><strong>{track.title}</strong><span>{track.artist}</span></div></div><div className="player-controls"><button className="player-skip" onClick={onPrevious} aria-label="Faixa anterior"><SkipBack size={16} fill="currentColor" /></button><button className="player-play" onClick={onToggle} aria-label={isPlaying ? "Pausar" : "Tocar"}>{isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}</button><button className="player-skip" onClick={onNext} aria-label="Próxima faixa"><SkipForward size={16} fill="currentColor" /></button></div><div className="player-progress"><span>{formatTime(progress)}</span><input type="range" min="0" max={Math.max(duration, track.duration)} value={Math.min(progress, Math.max(duration, track.duration))} onChange={event => onSeek(Number(event.target.value))} /><span>{formatTime(duration || track.duration)}</span></div></footer>;
}

export default function Home() {
  const { user, isAuthenticated, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [view, setView] = useState<View>(() => viewFromPath(location));
  const [activeGenre, setActiveGenre] = useState("Tudo");
  const [activeCity, setActiveCity] = useState("Campinas");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [followed, setFollowed] = useState<number[]>([]);
  const [interested, setInterested] = useState<number[]>([]);
  const [selectedArtist, setSelectedArtist] = useState<SceneArtist | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [role, setRole] = useState<"listener" | "artist">("listener");
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [playlistName, setPlaylistName] = useState("");
  const [collaborative, setCollaborative] = useState(true);
  const [uploadDraft, setUploadDraft] = useState<UploadDraft>({ title: "", album: "", genre: "Alt pop", city: "Campinas", description: "", rights: false, audio: null, cover: null });
  const [artistDraft, setArtistDraft] = useState<ArtistDraft>({ name: "", handle: "", city: "Campinas", genre: "", bio: "" });
  const audioRef = useRef<HTMLAudioElement>(null);
  const accountTypeMutation = trpc.scene.setAccountType.useMutation();
  const followMutation = trpc.scene.followArtist.useMutation();
  const interestMutation = trpc.scene.interestEvent.useMutation();
  const playMutation = trpc.scene.recordPlay.useMutation();
  const playlistMutation = trpc.scene.createPlaylist.useMutation();
  const eventMutation = trpc.scene.createEvent.useMutation();
  const uploadUrlMutation = trpc.scene.requestUpload.useMutation();
  const trackMutation = trpc.scene.createTrack.useMutation();
  const artistProfileMutation = trpc.scene.createArtistProfile.useMutation();
  const utils = trpc.useUtils();
  const discovery = trpc.scene.discovery.useQuery({ city: activeCity, genre: activeGenre, search: searchTerm }, { staleTime: 30_000 });
  const library = trpc.scene.library.useQuery(undefined, { enabled: isAuthenticated, staleTime: 15_000 });
  const artistProfile = trpc.scene.myArtistProfile.useQuery(undefined, { enabled: isAuthenticated && (user?.accountType === "artist" || user?.role === "admin"), staleTime: 15_000 });
  useEffect(() => {
    if (!library.data) return;
    setFollowed(library.data.followedArtistIds ?? []);
    setInterested(library.data.interestedEventIds ?? []);
  }, [library.data]);
  const content = useMemo<typeof fallbackContent>(() => {
    if (!discovery.data) return fallbackContent;
    return {
      ...fallbackContent,
      ...discovery.data,
      source: discovery.data.source === "database" ? "database" : "seed",
      tracks: discovery.data.tracks.map(track => ({
        ...track,
        genre: track.genre ?? "Cena local",
        audioUrl: track.audioUrl ?? undefined,
        cover: track.cover || sceneTracks[0].cover,
        accent: track.accent || "#c8f36a",
      })),
      artists: discovery.data.artists.map(artist => ({
        ...artist,
        genre: artist.genre || "Cena local",
        bio: artist.bio || "",
        image: artist.image || sceneArtists[0].image,
        accent: artist.accent || "#c8f36a",
        followers: artist.followers || "—",
      })),
      events: discovery.data.events.map(event => ({
        ...event,
        description: event.description || "Uma noite para ouvir a cidade de perto.",
        day: event.day || "—",
        month: event.month || "—",
        time: event.time || "—",
        color: event.color || "lime",
        interest: event.interest || 0,
        ticketUrl: event.ticketUrl ?? undefined,
      })),
    };
  }, [discovery.data]);
  const currentTrack = content.tracks[currentTrackIndex] ?? content.tracks[0] ?? sceneTracks[0];
  const isArtist = user?.accountType === "artist" || user?.role === "admin";

  useEffect(() => {
    setView(viewFromPath(location));
  }, [location]);

  useEffect(() => {
    const match = location.match(/^\/artistas\/([^/]+)/);
    if (!match) return;
    const handle = decodeURIComponent(match[1]).toLowerCase();
    const artist = content.artists.find(item => item.handle.replace(/^@/, "").toLowerCase() === handle);
    if (artist) setSelectedArtist(artist);
  }, [location, content.artists]);

  useEffect(() => {
    if (!isAuthenticated || !library.data) return;
    setFollowed(library.data.followedArtistIds);
    setInterested(library.data.interestedEventIds);
  }, [isAuthenticated, library.data]);

  useEffect(() => {
    const pendingRole = localStorage.getItem("cena-pending-role");
    if (isAuthenticated && pendingRole && (pendingRole === "listener" || pendingRole === "artist")) {
      accountTypeMutation.mutate({ accountType: pendingRole }, { onSuccess: () => { localStorage.removeItem("cena-pending-role"); void utils.auth.me.invalidate(); } });
    }
  }, [isAuthenticated, accountTypeMutation, utils]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.src = currentTrack.audioUrl ?? "";
    audio.load();
    if (isPlaying) audio.play().catch(() => setIsPlaying(false));
  }, [currentTrack.id]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) audio.play().catch(() => setIsPlaying(false));
    else audio.pause();
  }, [isPlaying]);

  const playTrack = (track: SceneTrack) => {
    const index = content.tracks.findIndex(item => item.id === track.id);
    setCurrentTrackIndex(index >= 0 ? index : 0);
    setProgress(0);
    setIsPlaying(true);
    playMutation.mutate({ trackId: track.id });
  };
  const nextTrack = () => { setCurrentTrackIndex(index => (index + 1) % content.tracks.length); setProgress(0); setIsPlaying(true); };
  const previousTrack = () => { setCurrentTrackIndex(index => (index - 1 + content.tracks.length) % content.tracks.length); setProgress(0); setIsPlaying(true); };
  const onFollow = (artistId: number) => { if (!isAuthenticated) { setShowAuth(true); return; } const wasFollowing = followed.includes(artistId); setFollowed(value => wasFollowing ? value.filter(id => id !== artistId) : [...value, artistId]); followMutation.mutate({ artistId }, { onSuccess: () => { void utils.scene.library.invalidate(); }, onError: () => { setFollowed(value => wasFollowing ? [...value, artistId] : value.filter(id => id !== artistId)); toast.error("Não foi possível atualizar esse follow agora."); } }); };
  const onInterest = (eventId: number) => { if (!isAuthenticated) { setShowAuth(true); return; } const wasInterested = interested.includes(eventId); setInterested(value => wasInterested ? value.filter(id => id !== eventId) : [...value, eventId]); interestMutation.mutate({ eventId }, { onSuccess: () => { void utils.scene.library.invalidate(); }, onError: () => { setInterested(value => wasInterested ? [...value, eventId] : value.filter(id => id !== eventId)); toast.error("Não foi possível atualizar esse interesse agora."); } }); };
  const share = async (label: string) => { const link = window.location.href; try { if (navigator.share) await navigator.share({ title: `CENA. — ${label}`, url: link }); else await navigator.clipboard.writeText(link); toast.success(`${label} pronto para compartilhar.`); } catch { toast.success(`Link de ${label.toLowerCase()} copiado.`); } };
  const chooseRole = (nextRole: "listener" | "artist") => { setRole(nextRole); if (!isAuthenticated) { localStorage.setItem("cena-pending-role", nextRole); startLogin(); return; } accountTypeMutation.mutate({ accountType: nextRole }, { onSuccess: () => { void utils.auth.me.invalidate(); setShowAuth(false); toast.success(nextRole === "artist" ? "Perfil de artista ativado." : "Perfil de ouvinte ativado."); } }); };
  const submitArtistProfile = () => { if (!artistDraft.name.trim() || !artistDraft.handle.trim() || !artistDraft.city.trim()) return; artistProfileMutation.mutate({ ...artistDraft, genre: artistDraft.genre || undefined, bio: artistDraft.bio || undefined }, { onSuccess: result => { void utils.scene.myArtistProfile.invalidate(); toast.success(result.persisted ? "Perfil de artista criado." : "Perfil salvo para a demonstração."); } }); };
  const createPlaylist = () => { if (!playlistName.trim()) return; if (!isAuthenticated) { setShowAuth(true); return; } playlistMutation.mutate({ name: playlistName.trim(), collaborative }, { onSuccess: result => { void utils.scene.library.invalidate(); setShowPlaylist(false); setPlaylistName(""); toast.success(result.persisted ? "Playlist criada na sua biblioteca." : "Playlist salva para a demonstração."); } }); };
  const createEvent = (draft: { name: string; venue: string; city: string; eventDate: string; description: string; ticketUrl?: string }) => { if (!isAuthenticated) { setShowAuth(true); return; } if (!artistProfile.data) { toast.error("Complete seu perfil de artista antes de criar um evento."); goTo("profile"); return; } eventMutation.mutate({ ...draft, ticketUrl: draft.ticketUrl || undefined, eventDate: new Date(draft.eventDate).toISOString() }, { onSuccess: result => { void utils.scene.discovery.invalidate(); toast.success(result.persisted ? "Evento publicado na agenda." : "Evento pronto para a demonstração."); } }); };
  const submitUpload = async () => {
    if (!isAuthenticated) { setShowAuth(true); return; }
    if (!isArtist) { setShowAuth(true); return; }
    if (!artistProfile.data) { toast.error("Complete seu perfil de artista antes de enviar uma faixa."); goTo("profile"); return; }
    if (!uploadDraft.audio || !uploadDraft.rights) { toast.error("Escolha um áudio e confirme os direitos autorais."); return; }
    if (!uploadDraft.audio.type.startsWith("audio/") || uploadDraft.audio.size > 50 * 1024 * 1024) { toast.error("Use um áudio compatível de até 50 MB."); return; }
    if (uploadDraft.cover && (uploadDraft.cover.size > 10 * 1024 * 1024 || !uploadDraft.cover.type.startsWith("image/"))) { toast.error("A capa deve ser uma imagem de até 10 MB."); return; }
    try {
      const audioRequest = await uploadUrlMutation.mutateAsync({ kind: "audio", fileName: uploadDraft.audio.name, contentType: uploadDraft.audio.type || "audio/mpeg", size: uploadDraft.audio.size });
      const audioResponse = await fetch(audioRequest.url, { method: "PUT", headers: { "Content-Type": uploadDraft.audio.type || "audio/mpeg" }, body: uploadDraft.audio });
      if (!audioResponse.ok) throw new Error("Falha no upload do áudio");
      let coverUrl: string | undefined;
      if (uploadDraft.cover) {
        const coverRequest = await uploadUrlMutation.mutateAsync({ kind: "image", fileName: uploadDraft.cover.name, contentType: uploadDraft.cover.type || "image/jpeg", size: uploadDraft.cover.size });
        const coverResponse = await fetch(coverRequest.url, { method: "PUT", headers: { "Content-Type": uploadDraft.cover.type || "image/jpeg" }, body: uploadDraft.cover });
        if (!coverResponse.ok) throw new Error("Falha no upload da capa");
        coverUrl = coverRequest.stableUrl;
      }
      await trackMutation.mutateAsync({ title: uploadDraft.title, album: uploadDraft.album || undefined, genre: uploadDraft.genre, city: uploadDraft.city, description: uploadDraft.description || undefined, audioUrl: audioRequest.stableUrl, coverUrl, rightsDeclared: true });
      void utils.scene.discovery.invalidate();
      toast.success("Faixa enviada. A cidade vai ouvir.");
      setUploadDraft({ title: "", album: "", genre: "Alt pop", city: "Campinas", description: "", rights: false, audio: null, cover: null });
      setView("home");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível concluir o upload."); }
  };

  const navItems: Array<{ id: View; label: string; icon: typeof HomeIcon }> = [{ id: "home", label: "Início", icon: HomeIcon }, { id: "search", label: "Buscar", icon: Search }, { id: "events", label: "Eventos", icon: CalendarDays }, { id: "library", label: "Biblioteca", icon: ListMusic }, { id: "profile", label: "Perfil", icon: UserRound }];
  const goTo = (nextView: View) => { setView(nextView); setLocation(pathFromView(nextView)); setSelectedArtist(null); setShowMenu(false); };
  const openArtist = (artist: SceneArtist) => { setSelectedArtist(artist); setView("profile"); setLocation(`/artistas/${encodeURIComponent(artist.handle.replace(/^@/, ""))}`); setShowMenu(false); };

  return <div className="scene-app"><audio ref={audioRef} preload="metadata" onError={() => { setIsPlaying(false); toast.error("Não foi possível tocar essa faixa agora."); }} onTimeUpdate={event => setProgress(event.currentTarget.currentTime)} onLoadedMetadata={event => setDuration(event.currentTarget.duration || 0)} onEnded={nextTrack} /><aside className="side-rail"><button className="brand-lockup" onClick={() => goTo("home")}><span className="brand-mark"><Radio size={15} strokeWidth={3} /></span><span>CENA<span className="brand-dot">.</span></span></button><div className="rail-label">Sua cena</div><nav className="rail-nav">{navItems.map(item => { const Icon = item.icon; return <button key={item.id} className={`nav-item ${view === item.id && !selectedArtist ? "active" : ""}`} onClick={() => goTo(item.id)}><Icon size={18} /><span>{item.label}</span>{item.id === "events" && <span className="nav-badge">{content.events.length}</span>}</button>; })}</nav><div className="rail-divider" /><div className="rail-label">Atalhos</div><button className="nav-item" onClick={() => goTo("upload")}><UploadCloud size={18} /><span>Enviar som</span><span className="shortcut-plus">+</span></button><button className="nav-item" onClick={() => setShowPlaylist(true)}><Plus size={18} /><span>Nova playlist</span></button><div className="side-note"><span className="note-orb"><Sparkles size={15} /></span><p><strong>Sem anúncios.</strong><br />Só música feita perto de você.</p></div><button className="account-pill" onClick={() => isAuthenticated ? logout() : setShowAuth(true)}><span className="avatar small">{isAuthenticated ? initials(user?.name || "Você") : "?"}</span><span className="account-copy"><strong>{isAuthenticated ? user?.name || "Sua conta" : "Entrar na Cena"}</strong><small>{isAuthenticated ? "Sair da conta" : "ou criar acesso"}</small></span>{isAuthenticated ? <LogOut size={16} /> : <LogIn size={16} />}</button></aside><main className="main-column"><header className="top-bar"><button className="mobile-brand brand-lockup" onClick={() => goTo("home")}><span className="brand-mark"><Radio size={14} strokeWidth={3} /></span><span>CENA<span className="brand-dot">.</span></span></button><div className="location-switch"><MapPin size={15} /><span>{activeCity}, SP</span><ChevronRight size={14} /></div><span className={`data-mode ${content.source === "seed" ? "is-demo" : "is-live"}`}>{content.source === "seed" ? "modo demonstração" : "cena ao vivo"}</span><div className="top-actions"><button className="icon-button notification-button" aria-label="Notificações" onClick={() => toast.success("Você está em dia com a sua cena.")}><Bell size={18} /><span /></button><button className="profile-trigger" onClick={() => isAuthenticated ? goTo("profile") : setShowAuth(true)}><span className="avatar">{isAuthenticated ? initials(user?.name || "Você") : "?"}</span><span className="profile-trigger-name">{isAuthenticated ? user?.name?.split(" ")[0] || "Você" : "Você"}</span></button><button className="icon-button mobile-menu" onClick={() => setShowMenu(value => !value)} aria-label="Abrir menu"><Menu size={19} /></button></div></header>{showMenu && <div className="mobile-menu-panel">{navItems.map(item => <button key={item.id} onClick={() => goTo(item.id)}>{item.label}</button>)}<button onClick={() => goTo("upload")}>Enviar som</button></div>}<div className="content-wrap">{view === "home" && !selectedArtist && <HomeView content={content} activeGenre={activeGenre} setActiveGenre={setActiveGenre} activeCity={activeCity} setActiveCity={setActiveCity} setView={goTo} onPlay={playTrack} onOpenArtist={openArtist} followed={followed} onFollow={onFollow} interested={interested} onInterest={onInterest} onShare={share} />}{view === "search" && !selectedArtist && <SearchView content={content} searchTerm={searchTerm} setSearchTerm={setSearchTerm} activeGenre={activeGenre} setActiveGenre={setActiveGenre} onPlay={playTrack} onOpenArtist={openArtist} followed={followed} onFollow={onFollow} onShare={share} />}{view === "events" && !selectedArtist && <EventsView content={content} interested={interested} onInterest={onInterest} onShare={share} onCreateEvent={createEvent} isArtist={Boolean(isArtist && artistProfile.data)} />}{view === "library" && !selectedArtist && <LibraryView content={content} followed={followed} onPlay={playTrack} onOpenArtist={openArtist} onCreatePlaylist={() => setShowPlaylist(true)} isAuthenticated={isAuthenticated} library={library.data} />}{view === "profile" && (selectedArtist ? <ArtistProfile artist={selectedArtist} content={content} followed={followed.includes(selectedArtist.id)} onFollow={() => onFollow(selectedArtist.id)} onPlay={playTrack} onShare={share} /> : <div className="page account-page"><div className="page-intro"><span className="eyebrow">seu perfil</span><h1>{isAuthenticated ? `Olá, ${user?.name?.split(" ")[0] || "ouvinte"}.` : "Encontre o seu lugar na cena."}</h1><p>{isAuthenticated ? "Escolha como você participa e mantenha sua biblioteca perto." : "Entre para seguir artistas, guardar playlists e receber os shows que combinam com você."}</p></div><div className="role-panel"><div><span className="eyebrow">tipo de acesso</span><h2>Como você chega?</h2><p>Você pode mudar de papel depois, sem perder nada.</p></div><div className="role-options"><button className={user?.accountType === "listener" ? "selected" : ""} onClick={() => chooseRole("listener")}><Headphones size={22} /><strong>Ouvinte</strong><span>Descobrir, seguir e montar playlists.</span>{user?.accountType === "listener" && <Check size={16} />}</button><button className={user?.accountType === "artist" ? "selected" : ""} onClick={() => chooseRole("artist")}><Disc3 size={22} /><strong>Artista / banda</strong><span>Publicar faixas e colocar shows na agenda.</span>{user?.accountType === "artist" && <Check size={16} />}</button></div>{!isAuthenticated && <button className="primary-button" onClick={() => setShowAuth(true)}><LogIn size={16} /> Entrar com Manus</button>}</div></div>)}{view === "profile" && !selectedArtist && isAuthenticated && isArtist && !artistProfile.data && <ArtistSetupView draft={artistDraft} setDraft={setArtistDraft} onSubmit={submitArtistProfile} isSaving={artistProfileMutation.isPending} />}{view === "upload" && <UploadView draft={uploadDraft} setDraft={setUploadDraft} onSubmit={submitUpload} isArtist={Boolean(isArtist && artistProfile.data)} />}</div></main><Player track={currentTrack} isPlaying={isPlaying} onToggle={() => setIsPlaying(value => !value)} onNext={nextTrack} onPrevious={previousTrack} progress={progress} duration={duration} onSeek={value => { setProgress(value); if (audioRef.current) audioRef.current.currentTime = value; }} /><nav className="bottom-nav">{navItems.map(item => { const Icon = item.icon; return <button key={item.id} className={view === item.id && !selectedArtist ? "active" : ""} onClick={() => goTo(item.id)}><Icon size={18} /><span>{item.label}</span></button>; })}</nav>{showAuth && <div className="modal-backdrop" onClick={() => setShowAuth(false)}><div className="auth-modal" onClick={event => event.stopPropagation()}><button className="modal-close" onClick={() => setShowAuth(false)}><X size={18} /></button><span className="eyebrow lime">entrar na cena</span><h2>Chegue do seu jeito.</h2><p>Escolha como você quer participar. O acesso é feito com Manus OAuth.</p><div className="role-options modal-roles"><button className={role === "listener" ? "selected" : ""} onClick={() => setRole("listener")}><Headphones size={21} /><strong>Ouvinte</strong><span>Quero descobrir sons perto de mim.</span></button><button className={role === "artist" ? "selected" : ""} onClick={() => setRole("artist")}><Disc3 size={21} /><strong>Artista / banda</strong><span>Quero publicar meu trabalho.</span></button></div><button className="primary-button full-button" onClick={() => chooseRole(role)}><LogIn size={16} /> Continuar com Manus</button></div></div>}{showPlaylist && <div className="modal-backdrop" onClick={() => setShowPlaylist(false)}><form className="small-modal" onSubmit={event => { event.preventDefault(); createPlaylist(); }} onClick={event => event.stopPropagation()}><button type="button" className="modal-close" onClick={() => setShowPlaylist(false)}><X size={18} /></button><span className="eyebrow">nova playlist</span><h2>Faça sua própria rota.</h2><input autoFocus required value={playlistName} onChange={event => setPlaylistName(event.target.value)} placeholder="Nome da playlist" /><label className="switch-line"><input type="checkbox" checked={collaborative} onChange={event => setCollaborative(event.target.checked)} /><span><strong>Playlist colaborativa</strong><small>Outras pessoas podem adicionar faixas.</small></span></label><button className="primary-button full-button" type="submit"><Plus size={16} /> Criar playlist</button></form></div>}</div>;
}
