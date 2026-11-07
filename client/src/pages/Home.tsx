import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  ArrowUpRight,
  Bell,
  Bookmark,
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
  avatarUrl?: string;
  coverUrl?: string;
  instagramUrl?: string;
  bandcampUrl?: string;
};

type ListenerDraft = { city: string; favoriteGenres: string; publicBio: string };

type LibrarySnapshot = {
  savedTrackIds?: number[];
  recentTrackIds?: number[];
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
  if (path.startsWith("/eventos/")) return "events";
  if (path === "/biblioteca") return "library";
  if (path.startsWith("/playlists/")) return "library";
  if (path === "/perfil" || path.startsWith("/artistas/")) return "profile";
  if (path.startsWith("/faixas/")) return "search";
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

function TrackRow({ track, active, playing, onPlay, onShare, saved, onSave, onAdd, onQueue }: { track: SceneTrack; active: boolean; playing: boolean; onPlay: () => void; onShare: () => void; saved?: boolean; onSave?: () => void; onAdd?: () => void; onQueue?: () => void }) {
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
      {onQueue && <button className="icon-button quiet" onClick={onQueue} aria-label={`Adicionar ${track.title} à fila`}><ListMusic size={16} /></button>}{onAdd && <button className="icon-button quiet" onClick={onAdd} aria-label={`Adicionar ${track.title} a uma playlist`}><Plus size={16} /></button>}{onSave && <button className={`icon-button quiet ${saved ? "is-saved" : ""}`} onClick={onSave} aria-label={saved ? `Remover ${track.title} das faixas salvas` : `Salvar ${track.title}`} aria-pressed={saved}><Bookmark size={16} fill={saved ? "currentColor" : "none"} /></button>}
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

function addEventToCalendar(event: SceneEvent) {
  const start = event.isoDate ? new Date(event.isoDate) : new Date();
  const end = new Date(start.getTime() + 90 * 60 * 1000);
  const format = (value: Date) => value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//CENA//Agenda local//PT-BR", "BEGIN:VEVENT", `UID:cena-event-${event.id}@cena`, `DTSTAMP:${format(new Date())}`, `DTSTART:${format(start)}`, `DTEND:${format(end)}`, `SUMMARY:${event.title.replace(/[,;\n]/g, " ")}`, `LOCATION:${event.place}, ${event.city}`, `DESCRIPTION:${event.description.replace(/[,;\n]/g, " ")}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
  const link = document.createElement("a"); link.href = url; link.download = `cena-${event.id}.ics`; link.click(); URL.revokeObjectURL(url);
}

function EventCard({ event, interested, onInterest, onShare, onOpenArtist }: { event: SceneEvent; interested: boolean; onInterest: () => void; onShare: (path?: string) => void; onOpenArtist: () => void }) {
  return (
    <article className={`event-card event-${event.color}`}>
      <div className="event-date"><strong>{event.day}</strong><span>{event.month}</span></div>
      <div className="event-main">
        <div className="event-meta"><span><Clock3 size={13} /> {event.time}</span><span><MapPin size={13} /> {event.city}</span></div>
        <h3>{event.title}</h3>
        <button className="event-place" onClick={onOpenArtist}>{event.place} <ArrowUpRight size={13} /></button>
        <p>{event.description}</p>
        {event.ticketUrl && <a className="event-place" href={event.ticketUrl} target="_blank" rel="noreferrer">Ingressos <Ticket size={12} /></a>}
        <div className="event-actions"><button className={`interest-button ${interested ? "is-interested" : ""}`} onClick={onInterest}>{interested ? <Check size={15} /> : <Heart size={15} />} {interested ? "Você vai" : "Tenho interesse"}</button><button className="icon-button quiet" onClick={() => addEventToCalendar(event)} aria-label="Adicionar evento ao calendário"><CalendarDays size={16} /></button><button className="icon-button quiet" onClick={() => onShare()} aria-label="Compartilhar evento"><Share2 size={16} /></button></div>
      </div>
      <Ticket size={18} className="event-ticket" />
    </article>
  );
}

function HomeView({ content, activeGenre, setActiveGenre, activeCity, setActiveCity, onPlay, onOpenArtist, followed, onFollow, interested, onInterest, onShare, savedTracks, onSaveTrack, onAddToPlaylist, onQueueTrack, setView }: { content: typeof fallbackContent; activeGenre: string; setActiveGenre: (genre: string) => void; activeCity: string; setActiveCity: (city: string) => void; onPlay: (track: SceneTrack) => void; onOpenArtist: (artist: SceneArtist) => void; followed: number[]; onFollow: (id: number) => void; interested: number[]; onInterest: (id: number) => void; onShare: (label: string, path?: string) => void; savedTracks: number[]; onSaveTrack: (id: number) => void; onAddToPlaylist: (id: number) => void; onQueueTrack: (id: number) => void; setView: (view: View) => void }) {
  return (
    <div className="page home-page">
      <section className="hero-block">
        <div className="hero-copy"><span className="eyebrow lime"><Radio size={13} /> AO VIVO EM {activeCity.toUpperCase()}</span><h1>A cidade tem<br /><em>som novo.</em></h1><p>Descubra faixas, artistas e shows feitos por quem vive a cena local.</p><div className="hero-actions"><button className="primary-button" onClick={() => content.tracks[0] && onPlay(content.tracks[0])}><Play size={16} fill="currentColor" /> Ouvir agora</button><button className="ghost-button" onClick={() => setView("events")}>Ver agenda <ChevronRight size={16} /></button></div></div>
        <div className="hero-art"><div className="hero-orb orb-one" /><div className="hero-orb orb-two" /><div className="hero-stamp"><span>escute<br />perto</span><Disc3 size={26} /></div><div className="hero-ticker"><span>• CENA LOCAL</span><span>• {activeCity.toUpperCase()}, SP</span><span>• SEM ANÚNCIOS</span></div></div>
      </section>

      <section className="content-section">
        <SectionTitle eyebrow="descoberta regional" title="Em alta na sua cidade" action="Ver tudo" onAction={() => setView("search")} />
        <div className="filter-row"><label className="city-chip"><MapPin size={14} /><select value={activeCity} onChange={event => setActiveCity(event.target.value)} aria-label="Escolher cidade">{sceneCities.map(city => <option key={city}>{city}</option>)}</select><ChevronRight size={14} /></label><div className="genre-filters">{content.genres.map(genre => <button key={genre} className={activeGenre === genre ? "active" : ""} onClick={() => setActiveGenre(genre)}>{genre}</button>)}</div></div>
        <div className="track-list">{content.tracks.length ? content.tracks.slice(0, 4).map((track, index) => <TrackRow key={track.id} track={track} active={index === 0} playing={false} onPlay={() => onPlay(track)} onShare={() => onShare(`Faixa ${track.title}`, `/faixas/${track.id}`)} saved={savedTracks.includes(track.id)} onSave={() => onSaveTrack(track.id)} onAdd={() => onAddToPlaylist(track.id)} onQueue={() => onQueueTrack(track.id)} />) : <EmptyState title={`Nada novo em ${activeCity}.`} message="Tente outro gênero ou escolha outra cidade para descobrir mais sons." />}</div>
      </section>

      <section className="content-section recommendation-section"><SectionTitle eyebrow="curadoria local" title="Por que isso apareceu para você" /><div className="recommendation-grid">{content.tracks.slice(1, 4).map(track => <article className="recommendation-card" key={track.id}><img src={track.cover} alt="" /><div><span className="card-kicker">novo em {track.city}</span><h3>{track.title}</h3><p>{track.artist} · {track.genre}</p><button className="ghost-button" onClick={() => onPlay(track)}>Ouvir porque é da sua cidade <Play size={14} /></button></div></article>)}</div></section>

      <section className="content-section split-section"><div className="split-main"><SectionTitle eyebrow="gente que faz" title="Artistas da cena" action="Conhecer artistas" onAction={() => setView("search")} /><div className="artist-strip">{content.artists.map(artist => <ArtistCard key={artist.id} artist={artist} onOpen={() => onOpenArtist(artist)} followed={followed.includes(artist.id)} onFollow={() => onFollow(artist.id)} />)}</div></div><div className="quote-card"><Sparkles size={18} /><p>“O melhor som é aquele que você encontra a três quarteirões de casa.”</p><span>— Caderno de rua, Cambuí</span></div></section>

      <section className="content-section"><SectionTitle eyebrow="chegue antes do refrão" title="Próximos shows" action="Abrir agenda" onAction={() => setView("events")} /><div className="event-list">{content.events.map(event => <EventCard key={event.id} event={event} interested={interested.includes(event.id)} onInterest={() => onInterest(event.id)} onShare={() => onShare(`Evento ${event.title}`, `/eventos/${event.id}`)} onOpenArtist={() => setView("events")} />)}</div></section>
    </div>
  );
}

function SearchView({ content, activeCity, searchTerm, setSearchTerm, activeGenre, setActiveGenre, onPlay, onOpenArtist, followed, onFollow, onShare, savedTracks, onSaveTrack, onAddToPlaylist, onQueueTrack }: { content: typeof fallbackContent; activeCity: string; searchTerm: string; setSearchTerm: (term: string) => void; activeGenre: string; setActiveGenre: (genre: string) => void; onPlay: (track: SceneTrack) => void; onOpenArtist: (artist: SceneArtist) => void; followed: number[]; onFollow: (id: number) => void; onShare: (label: string, path?: string) => void; savedTracks: number[]; onSaveTrack: (id: number) => void; onAddToPlaylist: (id: number) => void; onQueueTrack: (id: number) => void }) {
  const tracks = content.tracks.filter(track => activeGenre === "Tudo" || track.genre === activeGenre);
  return <div className="page"><div className="page-intro"><span className="eyebrow">explorar</span><h1>Buscar na cena.</h1><p>Artistas, faixas, gêneros e lugares para ouvir a cena de {activeCity}.</p></div><div className="search-box"><Search size={20} /><input value={searchTerm} onChange={event => setSearchTerm(event.target.value)} placeholder="Busque por artista, faixa, gênero ou cidade" autoFocus /></div><div className="filter-row search-filters"><div className="genre-filters">{content.genres.map(genre => <button key={genre} className={activeGenre === genre ? "active" : ""} onClick={() => setActiveGenre(genre)}>{genre}</button>)}</div></div><section className="content-section"><SectionTitle title={`Faixas ${searchTerm ? `para “${searchTerm}”` : "em destaque"}`} />{tracks.length ? <div className="track-list">{tracks.map(track => <TrackRow key={track.id} track={track} active={false} playing={false} onPlay={() => onPlay(track)} onShare={() => onShare(`Faixa ${track.title}`, `/faixas/${track.id}`)} saved={savedTracks.includes(track.id)} onSave={() => onSaveTrack(track.id)} onAdd={() => onAddToPlaylist(track.id)} onQueue={() => onQueueTrack(track.id)} />)}</div> : <EmptyState title="Nenhuma faixa encontrada." message="Tente outro termo, gênero ou cidade para continuar explorando." />}</section><section className="content-section"><SectionTitle title="Artistas" />{content.artists.length ? <div className="artist-strip">{content.artists.map(artist => <ArtistCard key={artist.id} artist={artist} onOpen={() => onOpenArtist(artist)} followed={followed.includes(artist.id)} onFollow={() => onFollow(artist.id)} />)}</div> : <EmptyState title="Nenhum artista encontrado." message="Ainda não há esse projeto no radar da sua cidade." />}</section></div>;
}

function EventsView({ content, interested, onInterest, onShare, onCreateEvent, isArtist, managedEvents, onDeleteEvent, onUpdateEvent }: { content: typeof fallbackContent; interested: number[]; onInterest: (id: number) => void; onShare: (label: string, path?: string) => void; onCreateEvent: (draft: { name: string; venue: string; city: string; eventDate: string; description: string; ticketUrl?: string }) => void; isArtist: boolean; managedEvents?: Array<{ id: number; name: string; venue: string; city: string; eventDate: Date; description: string | null; ticketUrl: string | null }>; onDeleteEvent: (id: number) => void; onUpdateEvent: (draft: { id: number; name: string; venue: string; city: string; eventDate: string; description: string; ticketUrl?: string }) => void }) {
  const [showComposer, setShowComposer] = useState(false);
  const [dateFilter, setDateFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("Todas");
  const [draft, setDraft] = useState({ name: "", venue: "", city: "Campinas", eventDate: "", description: "", ticketUrl: "" });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState({ name: "", venue: "", city: "", eventDate: "", description: "", ticketUrl: "" });
  const cities = ["Todas", ...Array.from(new Set(content.events.map(event => event.city)))];
  const filteredEvents = content.events.filter(event => {
    if (cityFilter !== "Todas" && event.city !== cityFilter) return false;
    if (dateFilter === "all" || !event.isoDate) return true;
    const days = (new Date(event.isoDate).getTime() - Date.now()) / 86_400_000;
    return days >= -1 && days <= Number(dateFilter);
  });
  return <div className="page"><div className="page-intro page-intro-row"><div><span className="eyebrow">agenda local</span><h1>Onde a cena se encontra.</h1><p>Shows, feiras e noites que merecem sair de casa.</p></div>{isArtist && <button className="primary-button" onClick={() => setShowComposer(value => !value)}><Plus size={16} /> Criar evento</button>}</div>{showComposer && <form className="composer-card" onSubmit={event => { event.preventDefault(); onCreateEvent(draft); setShowComposer(false); }}><div className="composer-heading"><div><span className="eyebrow">artista</span><h2>Coloque seu show na agenda.</h2></div><button type="button" className="icon-button" onClick={() => setShowComposer(false)}><X size={18} /></button></div><div className="form-grid"><label>Nome do evento<input required value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })} placeholder="Festival, show, sessão..." /></label><label>Local<input required value={draft.venue} onChange={event => setDraft({ ...draft, venue: event.target.value })} placeholder="Nome da casa" /></label><label>Cidade<input required value={draft.city} onChange={event => setDraft({ ...draft, city: event.target.value })} /></label><label>Data e hora<input required type="datetime-local" value={draft.eventDate} onChange={event => setDraft({ ...draft, eventDate: event.target.value })} /></label></div><label>Descrição<textarea value={draft.description} onChange={event => setDraft({ ...draft, description: event.target.value })} placeholder="O que acontece nessa noite?" /></label><label>Link de ingresso<input type="url" value={draft.ticketUrl} onChange={event => setDraft({ ...draft, ticketUrl: event.target.value })} placeholder="https://... (opcional)" /></label><button className="primary-button" type="submit">Publicar na agenda <ArrowUpRight size={16} /></button></form>}<div className="event-filters"><span className="eyebrow">filtrar agenda</span><select value={cityFilter} onChange={event => setCityFilter(event.target.value)}>{cities.map(city => <option key={city}>{city}</option>)}</select><select value={dateFilter} onChange={event => setDateFilter(event.target.value)}><option value="all">Todas as datas</option><option value="7">Próximos 7 dias</option><option value="30">Próximos 30 dias</option></select></div><>{isArtist && managedEvents?.length ? <section className="content-section managed-events"><SectionTitle eyebrow="seu painel" title="Meus eventos" />{managedEvents.map(event => editingId === event.id ? <form className="managed-event-edit" key={event.id} onSubmit={submit => { submit.preventDefault(); onUpdateEvent({ id: event.id, ...editDraft, ticketUrl: editDraft.ticketUrl || undefined }); setEditingId(null); }}><input required value={editDraft.name} onChange={input => setEditDraft({ ...editDraft, name: input.target.value })} /><input required value={editDraft.venue} onChange={input => setEditDraft({ ...editDraft, venue: input.target.value })} /><input required value={editDraft.city} onChange={input => setEditDraft({ ...editDraft, city: input.target.value })} /><input required type="datetime-local" value={editDraft.eventDate} onChange={input => setEditDraft({ ...editDraft, eventDate: input.target.value })} /><textarea value={editDraft.description} onChange={input => setEditDraft({ ...editDraft, description: input.target.value })} /><input type="url" value={editDraft.ticketUrl} onChange={input => setEditDraft({ ...editDraft, ticketUrl: input.target.value })} placeholder="Link de ingresso" /><div><button className="primary-button" type="submit">Salvar</button><button className="ghost-button" type="button" onClick={() => setEditingId(null)}>Cancelar</button></div></form> : <div className="managed-event-row" key={event.id}><div><strong>{event.name}</strong><span>{event.eventDate.toLocaleDateString("pt-BR")} · {event.venue}, {event.city}</span></div><div className="managed-event-actions"><button className="ghost-button" onClick={() => { setEditingId(event.id); setEditDraft({ name: event.name, venue: event.venue, city: event.city, eventDate: new Date(event.eventDate).toISOString().slice(0, 16), description: event.description ?? "", ticketUrl: event.ticketUrl ?? "" }); }}>Editar</button><button className="ghost-button danger-button" onClick={() => onDeleteEvent(event.id)}>Excluir</button></div></div>)}</section> : null}</><div className="event-list event-page-list">{filteredEvents.map(event => <EventCard key={event.id} event={event} interested={interested.includes(event.id)} onInterest={() => onInterest(event.id)} onShare={() => onShare(`Evento ${event.title}`, `/eventos/${event.id}`)} onOpenArtist={() => undefined} />)}</div></div>;
}

function LibraryView({ content, followed, onPlay, onOpenArtist, onCreatePlaylist, isAuthenticated, library, savedTracks, onSaveTrack }: { content: typeof fallbackContent; followed: number[]; onPlay: (track: SceneTrack) => void; onOpenArtist: (artist: SceneArtist) => void; onCreatePlaylist: () => void; isAuthenticated: boolean; library: LibrarySnapshot | undefined; savedTracks: number[]; onSaveTrack: (id: number) => void }) {
  const followedArtists = content.artists.filter(artist => followed.includes(artist.id));
  const saved = content.tracks.filter(track => savedTracks.includes(track.id));
  const recent = content.tracks.filter(track => library?.recentTrackIds?.includes(track.id));
  const playlists = library?.playlists?.length ? library.playlists.map(playlist => ({ ...playlist, owner: "Você", description: playlist.collaborative ? "Aberta para a sua comunidade adicionar faixas." : "Sua rota pessoal pela cidade.", tracks: playlist.trackIds })) : content.playlists;
  return <div className="page"><div className="page-intro page-intro-row"><div><span className="eyebrow">seu canto</span><h1>Biblioteca.</h1><p>O que você guardou, seguiu e quer ouvir de novo.</p></div><button className="primary-button" onClick={onCreatePlaylist}><Plus size={16} /> Nova playlist</button></div><section className="content-section"><SectionTitle title="Atividade" /><div className="activity-list">{content.activity.map(item => <div className="activity-item" key={item.id}><span className="activity-icon" style={{ background: item.accent }} /> <div><strong>{item.title}</strong><span>{item.time}</span></div><ArrowUpRight size={15} /></div>)}</div></section><section className="content-section"><SectionTitle title="Continuar ouvindo" />{recent.length ? <div className="track-list">{recent.slice(0, 5).map(track => <TrackRow key={track.id} track={track} active={false} playing={false} onPlay={() => onPlay(track)} onShare={() => undefined} saved={savedTracks.includes(track.id)} onSave={() => onSaveTrack(track.id)} />)}</div> : <div className="empty-card"><CirclePlay size={22} /><strong>Seu histórico começa aqui.</strong><span>Toque uma faixa para encontrá-la de novo na Biblioteca.</span></div>}</section><section className="content-section"><SectionTitle title="Faixas salvas" />{saved.length ? <div className="track-list">{saved.map(track => <TrackRow key={track.id} track={track} active={false} playing={false} onPlay={() => onPlay(track)} onShare={() => undefined} saved onSave={() => onSaveTrack(track.id)} />)}</div> : <div className="empty-card"><Bookmark size={22} /><strong>Suas faixas favoritas ficam aqui.</strong><span>Salve uma música durante a descoberta para ouvi-la de novo.</span></div>}</section><section className="content-section"><SectionTitle title={library?.playlists?.length ? "Suas playlists" : "Playlists seed"} /><div className="playlist-strip">{playlists.map(playlist => <article className="playlist-card" key={playlist.id}><div className="playlist-collage"><span style={{ background: "#c8f36a" }} /><span style={{ background: "#ff765f" }} /><span style={{ background: "#a69aff" }} /><ListMusic size={22} /></div><span className="card-kicker">{playlist.collaborative ? "colaborativa" : "playlist local"}</span><h3>{playlist.name}</h3><p>{playlist.description}</p><small>{playlist.owner} · {playlist.tracks.length} faixas</small></article>)}</div></section><section className="content-section"><SectionTitle title="Artistas seguidos" />{followedArtists.length ? <div className="artist-strip">{followedArtists.map(artist => <ArtistCard key={artist.id} artist={artist} onOpen={() => onOpenArtist(artist)} followed onFollow={() => undefined} />)}</div> : <div className="empty-card"><Heart size={22} /><strong>Você ainda não segue ninguém.</strong><span>Descubra artistas da sua cidade e monte seu próprio radar.</span></div>}</section>{!isAuthenticated && <div className="login-callout"><LogIn size={20} /><div><strong>Entre para guardar sua cena.</strong><span>Follows, playlists e interesses ficam com você em qualquer tela.</span></div></div>}</div>;
}

function EntityView({ path, content, onPlay, onInterest, interested, onSaveTrack, savedTracks, onShare, onOpenArtist, onAddToPlaylist, onQueueTrack }: { path: string; content: typeof fallbackContent; onPlay: (track: SceneTrack) => void; onInterest: (id: number) => void; interested: number[]; onSaveTrack: (id: number) => void; savedTracks: number[]; onShare: (label: string, path?: string) => void; onOpenArtist: (artist: SceneArtist) => void; onAddToPlaylist: (id: number) => void; onQueueTrack: (id: number) => void }) {
  const parts = path.split("/");
  const id = Number(parts[2]);
  if (path.startsWith("/faixas/")) {
    const track = content.tracks.find(item => item.id === id) ?? content.tracks[0];
    if (!track) return <div className="page"><EmptyState title="Faixa não encontrada." message="Esse som pode ter sido removido ou ainda não chegou à sua cidade." /></div>;
    return <div className="page detail-page"><span className="eyebrow lime">faixa compartilhada</span><div className="detail-hero"><img src={track.cover} alt="" /><div><h1>{track.title}</h1><p>{track.artist} · {track.genre} · {track.city}</p><div className="hero-actions"><button className="primary-button" onClick={() => onPlay(track)}><Play size={16} fill="currentColor" /> Ouvir agora</button><button className={`ghost-button ${savedTracks.includes(track.id) ? "is-saved" : ""}`} onClick={() => onSaveTrack(track.id)}><Bookmark size={16} /> {savedTracks.includes(track.id) ? "Salva" : "Salvar"}</button><button className="icon-button" onClick={() => onShare(`Faixa ${track.title}`, `/faixas/${track.id}`)}><Share2 size={16} /></button></div></div></div></div>;
  }
  if (path.startsWith("/eventos/")) {
    const event = content.events.find(item => item.id === id) ?? content.events[0];
    if (!event) return <div className="page"><EmptyState title="Evento não encontrado." message="Confira a agenda para descobrir os próximos encontros." /></div>;
    return <div className="page detail-page"><span className="eyebrow coral">evento compartilhado</span><div className="detail-event-date"><strong>{event.day}</strong><span>{event.month}</span></div><h1>{event.title}</h1><p className="detail-meta">{event.place} · {event.city} · {event.time}</p><p className="detail-description">{event.description}</p><div className="hero-actions"><button className="primary-button" onClick={() => onInterest(event.id)}>{interested.includes(event.id) ? "Você vai" : "Tenho interesse"}</button>{event.ticketUrl && <a className="ghost-button" href={event.ticketUrl} target="_blank" rel="noreferrer"><Ticket size={16} /> Ingressos</a>}<button className="icon-button" onClick={() => onShare(`Evento ${event.title}`, `/eventos/${event.id}`)}><Share2 size={16} /></button></div></div>;
  }
  const playlist = content.playlists.find(item => item.id === id) ?? content.playlists[0];
  if (!playlist) return <div className="page"><EmptyState title="Playlist não encontrada." message="Crie uma nova rota pela cidade na sua Biblioteca." /></div>;
  const playlistTracks = content.tracks.filter(track => playlist.tracks.includes(track.id));
  return <div className="page detail-page"><span className="eyebrow lavender">playlist local</span><h1>{playlist.name}</h1><p>{playlist.description}</p><div className="track-list">{playlistTracks.length ? playlistTracks.map(track => <TrackRow key={track.id} track={track} active={false} playing={false} onPlay={() => onPlay(track)} onShare={() => onShare(`Faixa ${track.title}`, `/faixas/${track.id}`)} saved={savedTracks.includes(track.id)} onSave={() => onSaveTrack(track.id)} onAdd={() => onAddToPlaylist(track.id)} onQueue={() => onQueueTrack(track.id)} />) : <EmptyState title="Essa playlist ainda está vazia." message="Adicione faixas para construir sua rota pela cena." />}</div></div>;
}

function ArtistProfile({ artist, content, followed, onFollow, onPlay, onShare }: { artist: SceneArtist; content: typeof fallbackContent; followed: boolean; onFollow: () => void; onPlay: (track: SceneTrack) => void; onShare: (label: string, path?: string) => void }) {
  const artistTracks = content.tracks.filter(track => track.artistId === artist.id);
  const artistEvents = content.events.filter(event => event.artistId === artist.id);
  return <div className="page artist-profile-page"><div className="artist-cover" style={{ "--accent": artist.accent } as CSSProperties}><img src={artist.image} alt="" /><div className="artist-cover-shade" /><span className="artist-cover-label">{artist.city}</span></div><div className="artist-profile-head"><div><span className="eyebrow">{artist.handle} · {artist.genre}</span><h1>{artist.name}</h1><p>{artist.bio}</p></div><div className="profile-actions"><button className={`follow-button large ${followed ? "is-followed" : ""}`} onClick={onFollow}>{followed ? <Check size={15} /> : <Plus size={15} />} {followed ? "Seguindo" : "Seguir"}</button><button className="icon-button" onClick={() => onShare(`Perfil de ${artist.name}`, `/artistas/${encodeURIComponent(artist.handle.replace(/^@/, ""))}`)}><Share2 size={17} /></button></div></div><section className="content-section"><SectionTitle eyebrow="faixas" title={`O som de ${artist.name}`} /><div className="track-list">{artistTracks.map(track => <TrackRow key={track.id} track={track} active={false} playing={false} onPlay={() => onPlay(track)} onShare={() => onShare(`Faixa ${track.title}`, `/faixas/${track.id}`)} />)}</div></section>{artistEvents.length > 0 && <section className="content-section"><SectionTitle eyebrow="agenda" title="Próximos shows" /><div className="event-list event-page-list">{artistEvents.map(event => <EventCard key={event.id} event={event} interested={false} onInterest={() => undefined} onShare={() => onShare(`Evento ${event.title}`, `/eventos/${event.id}`)} onOpenArtist={() => undefined} />)}</div></section>}<section className="profile-links"><span><Users size={15} /> {artist.followers} ouvintes</span>{artist.instagramUrl && <a href={artist.instagramUrl} target="_blank" rel="noreferrer">Instagram <ArrowUpRight size={13} /></a>}{artist.bandcampUrl && <a href={artist.bandcampUrl} target="_blank" rel="noreferrer">Bandcamp <ArrowUpRight size={13} /></a>}</section></div>;
}

function UploadView({ draft, setDraft, onSubmit, isArtist, uploadStatus, onOpenProfile, onRequestNotifications }: { draft: UploadDraft; setDraft: (draft: UploadDraft) => void; onSubmit: () => void; isArtist: boolean; uploadStatus: string; onOpenProfile: () => void; onRequestNotifications: () => void }) {
  const audioInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const canNotify = typeof window !== "undefined" && "Notification" in window;
  const notificationPermission = canNotify ? Notification.permission : "unsupported";
  return <div className="page"><div className="page-intro"><span className="eyebrow">selo aberto</span><h1>Seu som merece<br /><em>um lugar na cidade.</em></h1><p>Envie uma faixa, conte de onde ela vem e deixe a cena encontrar você.</p></div><div className="android-permission-card"><strong>Pronto para enviar pelo Android?</strong><span>Ao tocar em “Escolher áudio”, o Chrome abre o seletor de arquivos do aparelho. Não é necessário liberar acesso geral ao armazenamento: você escolhe apenas o arquivo que deseja enviar.</span>{canNotify && notificationPermission === "default" && <button className="ghost-button" type="button" onClick={onRequestNotifications}>Permitir avisos de lançamentos</button>}{canNotify && notificationPermission === "denied" && <small>Os avisos estão bloqueados no Chrome. Abra as permissões do site para permitir notificações.</small>}</div><form className="upload-form" onSubmit={event => { event.preventDefault(); onSubmit(); }}>{uploadStatus && <div className="upload-status" role="status"><strong>{uploadStatus}</strong><span>Não feche esta tela até a publicação terminar.</span></div>}{!isArtist && <div className="upload-lock" role="status"><strong>Seu acesso atual é de ouvinte.</strong><span>Para publicar uma faixa, crie primeiro um perfil de artista ou banda.</span><button className="ghost-button" type="button" onClick={onOpenProfile}>Criar perfil de artista</button></div>}<div className="upload-drop"><UploadCloud size={26} /><strong>{draft.audio ? draft.audio.name : "Escolha o arquivo de áudio"}</strong><span>MP3, WAV, M4A ou OGG · até 50 MB</span><button className="primary-button" type="button" onClick={() => audioInputRef.current?.click()}>Escolher áudio</button><input ref={audioInputRef} required type="file" accept="audio/*,.mp3,.wav,.m4a,.ogg" onChange={event => setDraft({ ...draft, audio: event.target.files?.[0] ?? null })} /></div><div className="form-grid"><label>Título da faixa<input required value={draft.title} onChange={event => setDraft({ ...draft, title: event.target.value })} placeholder="Como ela se chama?" /></label><label>Álbum ou projeto<input value={draft.album} onChange={event => setDraft({ ...draft, album: event.target.value })} placeholder="Opcional" /></label><label>Gênero<select value={draft.genre} onChange={event => setDraft({ ...draft, genre: event.target.value })}>{sceneGenres.filter(genre => genre !== "Tudo").map(genre => <option key={genre}>{genre}</option>)}</select></label><label>Cidade<input required value={draft.city} onChange={event => setDraft({ ...draft, city: event.target.value })} /></label></div><label>Descrição<textarea value={draft.description} onChange={event => setDraft({ ...draft, description: event.target.value })} placeholder="Uma frase sobre essa faixa" /></label><div className="cover-input"><span>Capa da faixa</span><button className="ghost-button" type="button" onClick={() => coverInputRef.current?.click()}>{draft.cover ? draft.cover.name : "Escolher imagem"}</button><input ref={coverInputRef} type="file" accept="image/*,.jpg,.jpeg,.png,.webp" onChange={event => setDraft({ ...draft, cover: event.target.files?.[0] ?? null })} /></div><label className="rights-check"><input type="checkbox" checked={draft.rights} onChange={event => setDraft({ ...draft, rights: event.target.checked })} /><span><strong>Declaro que tenho os direitos.</strong> Confirmo que sou o artista ou representante autorizado do áudio e da imagem enviados. A Cena pode hospedar e reproduzir este conteúdo conforme os termos de uso.</span></label><button className="primary-button" type="submit" disabled={!isArtist || !draft.audio || !draft.rights || Boolean(uploadStatus)}><UploadCloud size={16} /> {isArtist ? "Enviar para a Cena" : "Crie um perfil de artista primeiro"}</button></form></div>;
}
function ArtistSetupView({ draft, setDraft, onSubmit, isSaving }: { draft: ArtistDraft; setDraft: (draft: ArtistDraft) => void; onSubmit: () => void; isSaving: boolean }) {
  return <form className="composer-card artist-setup-card" onSubmit={event => { event.preventDefault(); onSubmit(); }}><div className="composer-heading"><div><span className="eyebrow lime">primeiro passo</span><h2>Apresente seu projeto.</h2><p>Seu perfil é a porta de entrada para faixas, shows e novos ouvintes.</p></div></div><div className="form-grid"><label>Nome artístico<input required minLength={2} value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })} placeholder="Como a cidade conhece você?" /></label><label>@ do projeto<input required pattern="@?[A-Za-z0-9_]+" value={draft.handle} onChange={event => setDraft({ ...draft, handle: event.target.value })} placeholder="lumeazul" /></label><label>Cidade<input required value={draft.city} onChange={event => setDraft({ ...draft, city: event.target.value })} placeholder="Campinas" /></label><label>Gênero<input value={draft.genre} onChange={event => setDraft({ ...draft, genre: event.target.value })} placeholder="Indie pop" /></label></div><label>Bio<textarea value={draft.bio} onChange={event => setDraft({ ...draft, bio: event.target.value })} placeholder="Conte em poucas linhas de onde vem o seu som." maxLength={1000} /></label><button className="primary-button" type="submit" disabled={isSaving}>{isSaving ? "Salvando perfil..." : "Criar perfil de artista"} <ArrowUpRight size={16} /></button></form>;
}

function ListenerProfileView({ draft, setDraft, onSubmit, isSaving }: { draft: ListenerDraft; setDraft: (draft: ListenerDraft) => void; onSubmit: () => void; isSaving: boolean }) {
  return <form className="composer-card listener-profile-card" onSubmit={event => { event.preventDefault(); onSubmit(); }}><div className="composer-heading"><div><span className="eyebrow lavender">perfil de público</span><h2>Monte seu radar local.</h2><p>Esse perfil é separado do perfil de artista e serve para personalizar cidade, gêneros e agenda.</p></div></div><div className="form-grid"><label>Sua cidade<input required value={draft.city} onChange={event => setDraft({ ...draft, city: event.target.value })} placeholder="Campinas" /></label><label>Gêneros favoritos<input value={draft.favoriteGenres} onChange={event => setDraft({ ...draft, favoriteGenres: event.target.value })} placeholder="Indie, MPB, eletrônico" /></label></div><label>Sobre você<textarea maxLength={500} value={draft.publicBio} onChange={event => setDraft({ ...draft, publicBio: event.target.value })} placeholder="O que você gosta de encontrar na cena?" /></label><button className="primary-button" type="submit" disabled={isSaving}>{isSaving ? "Salvando perfil..." : "Salvar perfil de público"} <ArrowUpRight size={16} /></button></form>;
}

function ArtistStudioView({ profile, stats, draft, setDraft, onSave, onRemoveTrack, isSaving }: { profile: NonNullable<Awaited<ReturnType<typeof Promise.resolve>>> & { name: string; handle: string; city: string; genre?: string | null; bio?: string | null }; stats: { plays: number; followers: number; events: Array<{ id: number; name: string; interest: number }>; topTracks: Array<{ id: number; title: string; plays: number }> } | null | undefined; draft: ArtistDraft; setDraft: (draft: ArtistDraft) => void; onSave: () => void; onRemoveTrack: (id: number) => void; isSaving: boolean }) {
  return <div className="artist-studio"><div className="section-title"><div><span className="eyebrow lime">seu estúdio</span><h2>O pulso do seu projeto.</h2></div><span className="data-mode is-live">dados reais</span></div><div className="stats-grid"><div className="stat-card"><strong>{stats?.plays ?? 0}</strong><span>reproduções</span></div><div className="stat-card"><strong>{stats?.followers ?? 0}</strong><span>seguidores</span></div><div className="stat-card"><strong>{stats?.events?.reduce((sum, event) => sum + event.interest, 0) ?? 0}</strong><span>interesses em shows</span></div></div><div className="composer-card"><div className="composer-heading"><div><span className="eyebrow">editar presença</span><h2>Deixe seu perfil mais completo.</h2></div><button className="primary-button" type="button" onClick={onSave} disabled={isSaving}>{isSaving ? "Salvando..." : "Salvar perfil"}</button></div><div className="form-grid"><label>Nome artístico<input value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })} /></label><label>@ do projeto<input value={draft.handle} onChange={event => setDraft({ ...draft, handle: event.target.value })} /></label><label>Cidade<input value={draft.city} onChange={event => setDraft({ ...draft, city: event.target.value })} /></label><label>Gênero<input value={draft.genre} onChange={event => setDraft({ ...draft, genre: event.target.value })} /></label></div><label>Bio<textarea maxLength={1000} value={draft.bio} onChange={event => setDraft({ ...draft, bio: event.target.value })} /></label><div className="form-grid"><label>Instagram<input type="url" value={draft.instagramUrl ?? ""} onChange={event => setDraft({ ...draft, instagramUrl: event.target.value })} placeholder="https://instagram.com/..." /></label><label>Bandcamp<input type="url" value={draft.bandcampUrl ?? ""} onChange={event => setDraft({ ...draft, bandcampUrl: event.target.value })} placeholder="https://..." /></label></div></div><div className="content-section"><SectionTitle eyebrow="desempenho" title="Faixas mais ouvidas" />{stats?.topTracks?.length ? <div className="activity-list">{stats.topTracks.map(track => <div className="activity-item" key={track.id}><span className="activity-icon" style={{ background: "#c8f36a" }} /><div><strong>{track.title}</strong><span>{track.plays} reproduções</span></div><button className="icon-button quiet" type="button" aria-label={`Remover ${track.title}`} onClick={() => onRemoveTrack(track.id)}><X size={15} /></button></div>)}</div> : <EmptyState title="Ainda não há reproduções." message="Publique uma faixa e compartilhe seu perfil para começar a acompanhar a cena." />}</div></div>;
}

function Player({ track, isPlaying, onToggle, onNext, onPrevious, progress, duration, onSeek, queueCount, onQueueOpen }: { track: SceneTrack; isPlaying: boolean; onToggle: () => void; onNext: () => void; onPrevious: () => void; progress: number; duration: number; onSeek: (value: number) => void; queueCount: number; onQueueOpen: () => void }) {
  return <footer className={`scene-player ${isPlaying ? "is-playing" : ""}`}><div className="player-track"><img src={track.cover} alt="" /><div><strong>{track.title}</strong><span>{track.artist}</span></div></div><div className="player-controls"><button className="player-skip" onClick={onPrevious} aria-label="Faixa anterior"><SkipBack size={16} fill="currentColor" /></button><button className="player-play" onClick={onToggle} aria-label={isPlaying ? "Pausar" : "Tocar"}>{isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}</button><button className="player-skip" onClick={onNext} aria-label="Próxima faixa"><SkipForward size={16} fill="currentColor" /></button></div><div className="player-progress"><button className="queue-count" onClick={onQueueOpen} aria-label="Abrir fila de reprodução">fila {queueCount}</button><span>{formatTime(progress)}</span><input type="range" min="0" max={Math.max(duration, track.duration)} value={Math.min(progress, Math.max(duration, track.duration))} onChange={event => onSeek(Number(event.target.value))} /><span>{formatTime(duration || track.duration)}</span></div></footer>;
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
  const [savedTracks, setSavedTracks] = useState<number[]>([]);
  const [selectedArtist, setSelectedArtist] = useState<SceneArtist | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [role, setRole] = useState<"listener" | "artist">("listener");
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [trackToAdd, setTrackToAdd] = useState<number | null>(null);
  const [queue, setQueue] = useState<number[]>([]);
  const [showQueue, setShowQueue] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [playlistName, setPlaylistName] = useState("");
  const [collaborative, setCollaborative] = useState(true);
  const [uploadDraft, setUploadDraft] = useState<UploadDraft>({ title: "", album: "", genre: "Alt pop", city: "Campinas", description: "", rights: false, audio: null, cover: null });
  const [artistDraft, setArtistDraft] = useState<ArtistDraft>({ name: "", handle: "", city: "Campinas", genre: "", bio: "" });
  const [listenerDraft, setListenerDraft] = useState<ListenerDraft>({ city: "Campinas", favoriteGenres: "", publicBio: "" });
  const [showArtistStudio, setShowArtistStudio] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const audioRef = useRef<HTMLAudioElement>(null);
  const accountTypeMutation = trpc.scene.setAccountType.useMutation();
  const followMutation = trpc.scene.followArtist.useMutation();
  const interestMutation = trpc.scene.interestEvent.useMutation();
  const saveTrackMutation = trpc.scene.saveTrack.useMutation();
  const playMutation = trpc.scene.recordPlay.useMutation();
  const playlistMutation = trpc.scene.createPlaylist.useMutation();
  const addTrackMutation = trpc.scene.addTrackToPlaylist.useMutation();
  const eventMutation = trpc.scene.createEvent.useMutation();
  const deleteEventMutation = trpc.scene.deleteEvent.useMutation();
  const updateEventMutation = trpc.scene.updateEvent.useMutation();
  const uploadUrlMutation = trpc.scene.requestUpload.useMutation();
  const cleanupUploadMutation = trpc.scene.cleanupUpload.useMutation();
  const trackMutation = trpc.scene.createTrack.useMutation();
  const takedownMutation = trpc.scene.takedownTrack.useMutation();
  const artistProfileMutation = trpc.scene.createArtistProfile.useMutation();
  const updateArtistProfileMutation = trpc.scene.updateArtistProfile.useMutation();
  const listenerProfileMutation = trpc.scene.updateListenerProfile.useMutation();
  const notifications = trpc.scene.notifications.useQuery(undefined, { enabled: isAuthenticated, staleTime: 15_000 });
  const markNotificationsReadMutation = trpc.scene.markNotificationsRead.useMutation();
  const utils = trpc.useUtils();
  const discovery = trpc.scene.discovery.useQuery({ city: activeCity, genre: activeGenre, search: searchTerm }, { staleTime: 30_000 });
  const library = trpc.scene.library.useQuery(undefined, { enabled: isAuthenticated, staleTime: 15_000 });
  const managedEvents = trpc.scene.myEvents.useQuery(undefined, { enabled: isAuthenticated && (user?.accountType === "artist" || user?.role === "admin"), staleTime: 15_000 });
  const artistStats = trpc.scene.artistStats.useQuery(undefined, { enabled: isAuthenticated && (user?.accountType === "artist" || user?.role === "admin"), staleTime: 30_000 });
  const artistProfile = trpc.scene.myArtistProfile.useQuery(undefined, { enabled: isAuthenticated && (user?.accountType === "artist" || user?.role === "admin"), staleTime: 15_000 });
  useEffect(() => {
    if (!library.data) return;
    setFollowed(library.data.followedArtistIds ?? []);
    setInterested(library.data.interestedEventIds ?? []);
    setSavedTracks(library.data.savedTrackIds ?? []);
  }, [library.data]);
  useEffect(() => {
    if (!artistProfile.data) return;
    setArtistDraft({ name: artistProfile.data.name, handle: artistProfile.data.handle, city: artistProfile.data.city, genre: artistProfile.data.genre ?? "", bio: artistProfile.data.bio ?? "", instagramUrl: artistProfile.data.instagramUrl ?? "", bandcampUrl: artistProfile.data.bandcampUrl ?? "" });
  }, [artistProfile.data]);
  useEffect(() => {
    if (!user) return;
    setListenerDraft({ city: user.city ?? "Campinas", favoriteGenres: user.favoriteGenres ?? "", publicBio: user.publicBio ?? "" });
  }, [user]);
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
    const titles: Record<string, string> = { "/": "CENA. — o som da sua cidade", "/buscar": "Buscar na cena — CENA.", "/eventos": "Eventos locais — CENA.", "/biblioteca": "Sua biblioteca — CENA.", "/perfil": "Seu perfil — CENA.", "/enviar": "Enviar som — CENA." };
    const title = titles[location] || "CENA. — o som da sua cidade";
    document.title = title;
    const description = "Descubra faixas, artistas e shows feitos por quem vive a cena local.";
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!meta) { meta = document.createElement("meta"); meta.name = "description"; document.head.appendChild(meta); }
    meta.content = description;
    const canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (canonical) canonical.href = window.location.origin + location;
    const routeUrl = window.location.origin + location;
    let ogUrl = document.querySelector('meta[property="og:url"]') as HTMLMetaElement | null;
    if (!ogUrl) { ogUrl = document.createElement("meta"); ogUrl.setAttribute("property", "og:url"); document.head.appendChild(ogUrl); }
    ogUrl.content = routeUrl;
    let ogImage = document.querySelector('meta[property="og:image"]') as HTMLMetaElement | null;
    if (!ogImage) { ogImage = document.createElement("meta"); ogImage.setAttribute("property", "og:image"); document.head.appendChild(ogImage); }
    ogImage.content = `${window.location.origin}/cena-logo.png`;
    ["og:title", "twitter:title"].forEach(property => { let tag = document.querySelector(`meta[property="${property}"], meta[name="${property}"]`) as HTMLMetaElement | null; if (!tag) { tag = document.createElement("meta"); tag.setAttribute(property.startsWith("og:") ? "property" : "name", property); document.head.appendChild(tag); } tag.content = title; });
    ["og:description", "twitter:description"].forEach(property => { let tag = document.querySelector(`meta[property="${property}"], meta[name="${property}"]`) as HTMLMetaElement | null; if (!tag) { tag = document.createElement("meta"); tag.setAttribute(property.startsWith("og:") ? "property" : "name", property); document.head.appendChild(tag); } tag.content = description; });
  }, [location]);
  useEffect(() => {
    const handler = (event: Event) => { event.preventDefault(); setInstallPrompt(event); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

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
  const nextTrack = () => { if (!content.tracks.length) { setIsPlaying(false); return; } setCurrentTrackIndex(index => (index + 1) % content.tracks.length); setProgress(0); setIsPlaying(true); };
  const previousTrack = () => { if (!content.tracks.length) { setIsPlaying(false); return; } setCurrentTrackIndex(index => (index - 1 + content.tracks.length) % content.tracks.length); setProgress(0); setIsPlaying(true); };
  const onFollow = (artistId: number) => { if (!isAuthenticated) { setShowAuth(true); return; } const wasFollowing = followed.includes(artistId); setFollowed(value => wasFollowing ? value.filter(id => id !== artistId) : [...value, artistId]); followMutation.mutate({ artistId }, { onSuccess: () => { void utils.scene.library.invalidate(); }, onError: () => { setFollowed(value => wasFollowing ? [...value, artistId] : value.filter(id => id !== artistId)); toast.error("Não foi possível atualizar esse follow agora."); } }); };
  const onInterest = (eventId: number) => { if (!isAuthenticated) { setShowAuth(true); return; } const wasInterested = interested.includes(eventId); setInterested(value => wasInterested ? value.filter(id => id !== eventId) : [...value, eventId]); interestMutation.mutate({ eventId }, { onSuccess: () => { void utils.scene.library.invalidate(); }, onError: () => { setInterested(value => wasInterested ? [...value, eventId] : value.filter(id => id !== eventId)); toast.error("Não foi possível atualizar esse interesse agora."); } }); };
  const onSaveTrack = (trackId: number) => { if (!isAuthenticated) { setSavedTracks(value => value.includes(trackId) ? value.filter(id => id !== trackId) : [...value, trackId]); setShowAuth(true); return; } const wasSaved = savedTracks.includes(trackId); setSavedTracks(value => wasSaved ? value.filter(id => id !== trackId) : [...value, trackId]); if (content.source === "database") saveTrackMutation.mutate({ trackId }, { onSuccess: () => { void utils.scene.library.invalidate(); }, onError: () => { setSavedTracks(value => wasSaved ? [...value, trackId] : value.filter(id => id !== trackId)); toast.error("Não foi possível salvar essa faixa agora."); } }); else toast.success(wasSaved ? "Faixa removida das salvas." : "Faixa salva nesta sessão."); };
  const share = async (label: string, path?: string) => { const link = new URL(path || window.location.pathname, window.location.origin).toString(); try { if (navigator.share) await navigator.share({ title: `CENA. — ${label}`, url: link }); else await navigator.clipboard.writeText(link); toast.success(`${label} pronto para compartilhar.`); } catch { toast.success(`Link de ${label.toLowerCase()} copiado.`); } };
  const installApp = async () => { if (installPrompt) { await installPrompt.prompt(); setInstallPrompt(null); return; } toast.info("No Chrome Android, abra ⋮ e escolha 'Adicionar à tela inicial' ou 'Instalar app'."); };
  const requestNotifications = async () => { if (!("Notification" in window)) { toast.info("Este navegador não oferece notificações web."); return; } const permission = await Notification.requestPermission(); toast.info(permission === "granted" ? "Avisos ativados neste dispositivo." : "Avisos não foram ativados."); };
  const chooseRole = (nextRole: "listener" | "artist") => { setRole(nextRole); if (!isAuthenticated) { localStorage.setItem("cena-pending-role", nextRole); startLogin(); return; } accountTypeMutation.mutate({ accountType: nextRole }, { onSuccess: () => { void utils.auth.me.invalidate(); setShowAuth(false); toast.success(nextRole === "artist" ? "Perfil de artista ativado." : "Perfil de ouvinte ativado."); } }); };
  const submitArtistProfile = () => { if (!artistDraft.name.trim() || !artistDraft.handle.trim() || !artistDraft.city.trim()) return; artistProfileMutation.mutate({ ...artistDraft, genre: artistDraft.genre || undefined, bio: artistDraft.bio || undefined }, { onSuccess: result => { void utils.scene.myArtistProfile.invalidate(); toast.success(result.persisted ? "Perfil de artista criado." : "Perfil salvo para a demonstração."); } }); };
  const saveArtistProfile = () => { updateArtistProfileMutation.mutate({ ...artistDraft, genre: artistDraft.genre || undefined, bio: artistDraft.bio || undefined, instagramUrl: artistDraft.instagramUrl || undefined, bandcampUrl: artistDraft.bandcampUrl || undefined }, { onSuccess: () => { void artistProfile.refetch(); toast.success("Perfil atualizado."); }, onError: error => toast.error(error.message) }); };
  const saveListenerProfile = () => { listenerProfileMutation.mutate({ ...listenerDraft, favoriteGenres: listenerDraft.favoriteGenres || undefined, publicBio: listenerDraft.publicBio || undefined }, { onSuccess: () => { void utils.auth.me.invalidate(); toast.success("Perfil de público atualizado."); }, onError: error => toast.error(error.message) }); };
  const addTrackToPlaylist = (playlistId: number) => { if (!trackToAdd) return; addTrackMutation.mutate({ playlistId, trackId: trackToAdd }, { onSuccess: result => { setTrackToAdd(null); toast.success(result.added ? "Faixa adicionada à playlist." : "Essa faixa já está na playlist."); void utils.scene.library.invalidate(); }, onError: error => toast.error(error.message) }); };
  const removeFromQueue = (trackId: number) => setQueue(value => value.filter(id => id !== trackId));
  const onQueueTrack = (trackId: number) => { setQueue(value => value.includes(trackId) ? value : [...value, trackId]); toast.success("Faixa adicionada à fila."); };
  const openAddToPlaylist = (trackId: number) => { if (!isAuthenticated) { setShowAuth(true); return; } if (!library?.data?.playlists?.length) { goTo("library"); toast.info("Crie uma playlist antes de adicionar faixas."); return; } setTrackToAdd(trackId); };
  const createPlaylist = () => { if (!playlistName.trim()) return; if (!isAuthenticated) { setShowAuth(true); return; } playlistMutation.mutate({ name: playlistName.trim(), collaborative }, { onSuccess: result => { void utils.scene.library.invalidate(); setShowPlaylist(false); setPlaylistName(""); toast.success(result.persisted ? "Playlist criada na sua biblioteca." : "Playlist salva para a demonstração."); } }); };
  const createEvent = (draft: { name: string; venue: string; city: string; eventDate: string; description: string; ticketUrl?: string }) => { if (!isAuthenticated) { setShowAuth(true); return; } if (!artistProfile.data) { toast.error("Complete seu perfil de artista antes de criar um evento."); goTo("profile"); return; } eventMutation.mutate({ ...draft, ticketUrl: draft.ticketUrl || undefined, eventDate: new Date(draft.eventDate).toISOString() }, { onSuccess: result => { void utils.scene.discovery.invalidate(); toast.success(result.persisted ? "Evento publicado na agenda." : "Evento pronto para a demonstração."); } }); };
  const removeTrack = (id: number) => { if (!window.confirm("Remover esta faixa da Cena? Ela ficará indisponível publicamente.")) return; takedownMutation.mutate({ trackId: id }, { onSuccess: () => { void utils.scene.discovery.invalidate(); void artistStats.refetch(); toast.success("Faixa removida da publicação."); }, onError: error => toast.error(error.message) }); };
  const deleteEvent = (id: number) => { if (!window.confirm("Excluir este evento da agenda?")) return; deleteEventMutation.mutate({ id }, { onSuccess: () => { void managedEvents.refetch(); void utils.scene.discovery.invalidate(); toast.success("Evento excluído."); }, onError: error => toast.error(error.message) }); };
  const updateEvent = (draft: { id: number; name: string; venue: string; city: string; eventDate: string; description: string; ticketUrl?: string }) => { updateEventMutation.mutate({ ...draft, eventDate: new Date(draft.eventDate).toISOString() }, { onSuccess: () => { void managedEvents.refetch(); void utils.scene.discovery.invalidate(); toast.success("Evento atualizado."); }, onError: error => toast.error(error.message) }); };
  const submitUpload = async () => {
    setUploadStatus("Preparando o envio...");
    if (!isAuthenticated) { setShowAuth(true); return; }
    if (!isArtist) { setShowAuth(true); return; }
    if (!artistProfile.data) { toast.error("Complete seu perfil de artista antes de enviar uma faixa."); goTo("profile"); return; }
    if (!uploadDraft.audio || !uploadDraft.rights) { toast.error("Escolha um áudio e confirme os direitos autorais."); return; }
    if (!uploadDraft.audio.type.startsWith("audio/") || uploadDraft.audio.size > 50 * 1024 * 1024) { toast.error("Use um áudio compatível de até 50 MB."); return; }
    if (uploadDraft.cover && (uploadDraft.cover.size > 10 * 1024 * 1024 || !uploadDraft.cover.type.startsWith("image/"))) { toast.error("A capa deve ser uma imagem de até 10 MB."); return; }
    const uploadedPaths: string[] = [];
    try {
      setUploadStatus("Enviando áudio...");
      const audioRequest = await uploadUrlMutation.mutateAsync({ kind: "audio", fileName: uploadDraft.audio.name, contentType: uploadDraft.audio.type || "audio/mpeg", size: uploadDraft.audio.size });
      const audioResponse = await fetch(audioRequest.url, { method: "PUT", headers: { "Content-Type": uploadDraft.audio.type || "audio/mpeg" }, body: uploadDraft.audio });
      if (!audioResponse.ok) throw new Error("Falha no upload do áudio");
      uploadedPaths.push(audioRequest.stableUrl);
      setUploadStatus("Áudio enviado. Validando capa...");
      let coverUrl: string | undefined;
      if (uploadDraft.cover) {
        const coverRequest = await uploadUrlMutation.mutateAsync({ kind: "image", fileName: uploadDraft.cover.name, contentType: uploadDraft.cover.type || "image/jpeg", size: uploadDraft.cover.size });
        const coverResponse = await fetch(coverRequest.url, { method: "PUT", headers: { "Content-Type": uploadDraft.cover.type || "image/jpeg" }, body: uploadDraft.cover });
        if (!coverResponse.ok) throw new Error("Falha no upload da capa");
        coverUrl = coverRequest.stableUrl;
        uploadedPaths.push(coverRequest.stableUrl);
      }
      setUploadStatus("Lendo duração do áudio...");
      const durationSeconds = await new Promise<number>(resolve => { const audio = new Audio(); const url = URL.createObjectURL(uploadDraft.audio!); audio.onloadedmetadata = () => { resolve(Math.round(audio.duration || 0)); URL.revokeObjectURL(url); }; audio.onerror = () => { resolve(0); URL.revokeObjectURL(url); }; audio.src = url; });
      setUploadStatus("Publicando sua faixa...");
      await trackMutation.mutateAsync({ title: uploadDraft.title, album: uploadDraft.album || undefined, genre: uploadDraft.genre, city: uploadDraft.city, description: uploadDraft.description || undefined, audioUrl: audioRequest.stableUrl, coverUrl, durationSeconds, rightsDeclared: true });
      void utils.scene.discovery.invalidate();
      toast.success("Faixa enviada. A cidade vai ouvir.");
      setUploadStatus("");
      setUploadDraft({ title: "", album: "", genre: "Alt pop", city: "Campinas", description: "", rights: false, audio: null, cover: null });
      setView("home");
    } catch (error) { if (uploadedPaths.length) cleanupUploadMutation.mutate({ paths: uploadedPaths }); setUploadStatus(""); toast.error(error instanceof Error ? error.message : "Não foi possível concluir o upload."); }
  };

  const navItems: Array<{ id: View; label: string; icon: typeof HomeIcon }> = [{ id: "home", label: "Início", icon: HomeIcon }, { id: "search", label: "Buscar", icon: Search }, { id: "events", label: "Eventos", icon: CalendarDays }, { id: "library", label: "Biblioteca", icon: ListMusic }, { id: "profile", label: "Perfil", icon: UserRound }];
  const goTo = (nextView: View) => { setView(nextView); setLocation(pathFromView(nextView)); setSelectedArtist(null); setShowMenu(false); };
  const openArtist = (artist: SceneArtist) => { setSelectedArtist(artist); setView("profile"); setLocation(`/artistas/${encodeURIComponent(artist.handle.replace(/^@/, ""))}`); setShowMenu(false); };

  return <div className="scene-app"><a className="skip-link" href="#main-content">Pular para o conteúdo</a><audio ref={audioRef} preload="metadata" onError={() => { setIsPlaying(false); toast.error("Não foi possível tocar essa faixa agora."); }} onTimeUpdate={event => setProgress(event.currentTarget.currentTime)} onLoadedMetadata={event => setDuration(event.currentTarget.duration || 0)} onEnded={nextTrack} /><aside className="side-rail"><button className="brand-lockup" onClick={() => goTo("home")}><span className="brand-mark"><Radio size={15} strokeWidth={3} /></span><span>CENA<span className="brand-dot">.</span></span></button><div className="rail-label">Sua cena</div><nav className="rail-nav">{navItems.map(item => { const Icon = item.icon; return <button key={item.id} className={`nav-item ${view === item.id && !selectedArtist ? "active" : ""}`} onClick={() => goTo(item.id)}><Icon size={18} /><span>{item.label}</span>{item.id === "events" && <span className="nav-badge">{content.events.length}</span>}</button>; })}</nav><div className="rail-divider" /><div className="rail-label">Atalhos</div><button className="nav-item" onClick={() => goTo("upload")}><UploadCloud size={18} /><span>Enviar som</span><span className="shortcut-plus">+</span></button><button className="nav-item" onClick={() => setShowPlaylist(true)}><Plus size={18} /><span>Nova playlist</span></button><div className="side-note"><span className="note-orb"><Sparkles size={15} /></span><p><strong>Sem anúncios.</strong><br />Só música feita perto de você.</p></div><button className="account-pill" onClick={() => isAuthenticated ? logout() : setShowAuth(true)}><span className="avatar small">{isAuthenticated ? initials(user?.name || "Você") : "?"}</span><span className="account-copy"><strong>{isAuthenticated ? user?.name || "Sua conta" : "Entrar na Cena"}</strong><small>{isAuthenticated ? "Sair da conta" : "ou criar acesso"}</small></span>{isAuthenticated ? <LogOut size={16} /> : <LogIn size={16} />}</button></aside><main id="main-content" className="main-column"><header className="top-bar"><button className="mobile-brand brand-lockup" onClick={() => goTo("home")}><span className="brand-mark"><Radio size={14} strokeWidth={3} /></span><span>CENA<span className="brand-dot">.</span></span></button><div className="location-switch"><MapPin size={15} /><span>{activeCity}, SP</span><ChevronRight size={14} /></div><span className={`data-mode ${content.source === "seed" ? "is-demo" : "is-live"}`}>{content.source === "seed" ? "modo demonstração" : "cena ao vivo"}</span><div className="top-actions"><button className="icon-button notification-button" aria-label="Abrir notificações" aria-expanded={showNotifications} onClick={() => { setShowNotifications(value => !value); if (isAuthenticated) markNotificationsReadMutation.mutate(); }}><Bell size={18} />{Boolean(notifications.data?.some(item => !item.readAt)) && <span />}</button><button className="profile-trigger" onClick={() => isAuthenticated ? goTo("profile") : setShowAuth(true)}><span className="avatar">{isAuthenticated ? initials(user?.name || "Você") : "?"}</span><span className="profile-trigger-name">{isAuthenticated ? user?.name?.split(" ")[0] || "Você" : "Você"}</span></button><button className="icon-button mobile-menu" onClick={() => setShowMenu(value => !value)} aria-label="Abrir menu"><Menu size={19} /></button></div></header>{showNotifications && <div className="notification-panel" role="dialog" aria-label="Notificações"><div className="notification-panel-head"><strong>Sua cena</strong><button className="icon-button quiet" aria-label="Fechar notificações" onClick={() => setShowNotifications(false)}><X size={15} /></button></div>{!isAuthenticated ? <p className="notification-empty">Entre para receber avisos de lançamentos e shows.</p> : notifications.data?.length ? notifications.data.map(item => <a className={`notification-item ${item.readAt ? "is-read" : ""}`} key={item.id} href={item.href || "#"} onClick={() => setShowNotifications(false)}><span className="notification-kind"><Bell size={13} /></span><span><strong>{item.title}</strong><small>{item.body}</small></span></a>) : <p className="notification-empty">Você está em dia com a sua cena.</p>}<button className="install-hint" onClick={installApp}>Instalar como app</button></div>}{showMenu && <div className="mobile-menu-panel">{navItems.map(item => <button key={item.id} onClick={() => goTo(item.id)}>{item.label}</button>)}<button onClick={() => goTo("upload")}>Enviar som</button><button onClick={installApp}>Instalar CENA.</button></div>}<div className="content-wrap">{(location.startsWith("/faixas/") || location.startsWith("/eventos/") || location.startsWith("/playlists/")) && !selectedArtist && <EntityView path={location} content={content} onPlay={playTrack} onInterest={onInterest} interested={interested} onSaveTrack={onSaveTrack} savedTracks={savedTracks} onShare={share} onOpenArtist={openArtist} onAddToPlaylist={openAddToPlaylist} onQueueTrack={onQueueTrack} />}{view === "home" && !selectedArtist && <HomeView content={content} activeGenre={activeGenre} setActiveGenre={setActiveGenre} activeCity={activeCity} setActiveCity={setActiveCity} setView={goTo} onPlay={playTrack} onOpenArtist={openArtist} followed={followed} onFollow={onFollow} interested={interested} onInterest={onInterest} onShare={share} savedTracks={savedTracks} onSaveTrack={onSaveTrack} onAddToPlaylist={openAddToPlaylist} onQueueTrack={onQueueTrack} />}{view === "search" && !selectedArtist && <SearchView content={content} activeCity={activeCity} searchTerm={searchTerm} setSearchTerm={setSearchTerm} activeGenre={activeGenre} setActiveGenre={setActiveGenre} onPlay={playTrack} onOpenArtist={openArtist} followed={followed} onFollow={onFollow} onShare={share} savedTracks={savedTracks} onSaveTrack={onSaveTrack} onAddToPlaylist={openAddToPlaylist} onQueueTrack={onQueueTrack} />}{view === "events" && !selectedArtist && <EventsView content={content} interested={interested} onInterest={onInterest} onShare={share} onCreateEvent={createEvent} isArtist={Boolean(isArtist && artistProfile.data)} managedEvents={managedEvents.data ?? undefined} onDeleteEvent={deleteEvent} onUpdateEvent={updateEvent} />}{view === "library" && !selectedArtist && <LibraryView content={content} followed={followed} onPlay={playTrack} onOpenArtist={openArtist} onCreatePlaylist={() => setShowPlaylist(true)} isAuthenticated={isAuthenticated} library={library.data} savedTracks={savedTracks} onSaveTrack={onSaveTrack} />}{view === "profile" && (selectedArtist ? <ArtistProfile artist={selectedArtist} content={content} followed={followed.includes(selectedArtist.id)} onFollow={() => onFollow(selectedArtist.id)} onPlay={playTrack} onShare={share} /> : <div className="page account-page"><div className="page-intro"><span className="eyebrow">seu perfil</span><h1>{isAuthenticated ? `Olá, ${user?.name?.split(" ")[0] || "ouvinte"}.` : "Encontre o seu lugar na cena."}</h1><p>{isAuthenticated ? "Escolha como você participa e mantenha sua biblioteca perto." : "Entre para seguir artistas, guardar playlists e receber os shows que combinam com você."}</p></div><div className="role-panel"><div><span className="eyebrow">tipo de acesso</span><h2>Como você chega?</h2><p>Você pode mudar de papel depois, sem perder nada.</p></div><div className="role-options"><button className={user?.accountType === "listener" ? "selected" : ""} onClick={() => chooseRole("listener")}><Headphones size={22} /><strong>Ouvinte</strong><span>Descobrir, seguir e montar playlists.</span>{user?.accountType === "listener" && <Check size={16} />}</button><button className={user?.accountType === "artist" ? "selected" : ""} onClick={() => chooseRole("artist")}><Disc3 size={22} /><strong>Artista / banda</strong><span>Publicar faixas e colocar shows na agenda.</span>{user?.accountType === "artist" && <Check size={16} />}</button></div>{!isAuthenticated && <button className="primary-button" onClick={() => setShowAuth(true)}><LogIn size={16} /> Entrar com Manus</button>}</div></div>)}{view === "profile" && !selectedArtist && isAuthenticated && user?.accountType === "listener" && <ListenerProfileView draft={listenerDraft} setDraft={setListenerDraft} onSubmit={saveListenerProfile} isSaving={listenerProfileMutation.isPending} />}{view === "profile" && !selectedArtist && isAuthenticated && isArtist && !artistProfile.data && <ArtistSetupView draft={artistDraft} setDraft={setArtistDraft} onSubmit={submitArtistProfile} isSaving={artistProfileMutation.isPending} />}{view === "profile" && !selectedArtist && isAuthenticated && isArtist && artistProfile.data && <><button className="primary-button" type="button" onClick={() => setShowArtistStudio(value => !value)}>{showArtistStudio ? "Fechar estúdio" : "Abrir estúdio do artista"}</button>{showArtistStudio && <ArtistStudioView profile={artistProfile.data} stats={artistStats.data} draft={artistDraft} setDraft={setArtistDraft} onSave={saveArtistProfile} onRemoveTrack={removeTrack} isSaving={updateArtistProfileMutation.isPending} />}</>}{view === "upload" && <UploadView draft={uploadDraft} setDraft={setUploadDraft} onSubmit={submitUpload} isArtist={Boolean(isArtist && artistProfile.data)} uploadStatus={uploadStatus} onOpenProfile={() => { if (!isAuthenticated) setShowAuth(true); else { chooseRole("artist"); goTo("profile"); } }} onRequestNotifications={requestNotifications} />}</div></main><Player track={currentTrack} isPlaying={isPlaying} onToggle={() => setIsPlaying(value => !value)} onNext={nextTrack} onPrevious={previousTrack} progress={progress} duration={duration} queueCount={queue.length} onQueueOpen={() => setShowQueue(true)} onSeek={value => { setProgress(value); if (audioRef.current) audioRef.current.currentTime = value; }} /><nav className="bottom-nav">{navItems.map(item => { const Icon = item.icon; return <button key={item.id} className={view === item.id && !selectedArtist ? "active" : ""} onClick={() => goTo(item.id)}><Icon size={18} /><span>{item.label}</span></button>; })}</nav>{showQueue && <div className="modal-backdrop" onClick={() => setShowQueue(false)}><div className="small-modal" onClick={event => event.stopPropagation()}><button className="modal-close" onClick={() => setShowQueue(false)}><X size={18} /></button><span className="eyebrow">player</span><h2>Fila de reprodução.</h2>{queue.length ? <div className="playlist-picker">{queue.map(id => { const track = content.tracks.find(item => item.id === id); return track ? <div className="playlist-picker-item" key={id}><ListMusic size={18} /><span>{track.title}</span><button className="icon-button quiet" onClick={() => removeFromQueue(id)} aria-label={`Remover ${track.title} da fila`}><X size={15} /></button></div> : null; })}</div> : <EmptyState title="Sua fila está vazia." message="Use o ícone de fila em uma faixa para decidir o que vem depois." />}</div></div>}{showAuth && <div className="modal-backdrop" onClick={() => setShowAuth(false)}><div className="auth-modal" onClick={event => event.stopPropagation()}><button className="modal-close" onClick={() => setShowAuth(false)}><X size={18} /></button><span className="eyebrow lime">entrar na cena</span><h2>Chegue do seu jeito.</h2><p>Escolha como você quer participar. O acesso é feito com Manus OAuth.</p><div className="role-options modal-roles"><button className={role === "listener" ? "selected" : ""} onClick={() => setRole("listener")}><Headphones size={21} /><strong>Ouvinte</strong><span>Quero descobrir sons perto de mim.</span></button><button className={role === "artist" ? "selected" : ""} onClick={() => setRole("artist")}><Disc3 size={21} /><strong>Artista / banda</strong><span>Quero publicar meu trabalho.</span></button></div><button className="primary-button full-button" onClick={() => chooseRole(role)}><LogIn size={16} /> Continuar com Manus</button></div></div>}{showPlaylist && <div className="modal-backdrop" onClick={() => setShowPlaylist(false)}><form className="small-modal" onSubmit={event => { event.preventDefault(); createPlaylist(); }} onClick={event => event.stopPropagation()}><button type="button" className="modal-close" onClick={() => setShowPlaylist(false)}><X size={18} /></button><span className="eyebrow">nova playlist</span><h2>Faça sua própria rota.</h2><input autoFocus required value={playlistName} onChange={event => setPlaylistName(event.target.value)} placeholder="Nome da playlist" /><label className="switch-line"><input type="checkbox" checked={collaborative} onChange={event => setCollaborative(event.target.checked)} /><span><strong>Playlist colaborativa</strong><small>Outras pessoas podem adicionar faixas.</small></span></label><button className="primary-button full-button" type="submit"><Plus size={16} /> Criar playlist</button></form></div>}{trackToAdd !== null && <div className="modal-backdrop" onClick={() => setTrackToAdd(null)}><div className="small-modal" onClick={event => event.stopPropagation()}><button className="modal-close" onClick={() => setTrackToAdd(null)}><X size={18} /></button><span className="eyebrow">adicionar faixa</span><h2>Escolha uma playlist.</h2>{library?.data?.playlists?.length ? <div className="playlist-picker">{library.data.playlists.map(playlist => <button key={playlist.id} className="playlist-picker-item" onClick={() => addTrackToPlaylist(playlist.id)}><ListMusic size={18} /><span>{playlist.name}</span><small>{playlist.trackIds.length} faixas</small></button>)}</div> : <EmptyState title="Você ainda não criou playlists." message="Crie uma playlist na Biblioteca para guardar esta faixa." />}</div></div>}</div>;
}
