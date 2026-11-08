import { ArrowUpRight, CalendarDays, Disc3, Edit3, Headphones, MapPin, Play, Share2, UploadCloud, Users } from "lucide-react";
import type { ReactNode } from "react";
import type { SceneTrack } from "@shared/scene-seed";

type ProfileUser = {
  name?: string | null;
  city?: string | null;
  favoriteGenres?: string | null;
  publicBio?: string | null;
  accountType?: "listener" | "artist" | null;
};

type ArtistProfile = {
  id: number;
  name: string;
  handle: string;
  city: string;
  profileType?: string | null;
  genre?: string | null;
  bio?: string | null;
  manifesto?: string | null;
  avatarUrl?: string | null;
  coverUrl?: string | null;
};

type ArtistStats = {
  plays: number;
  followers: number;
  events: Array<{ id: number; name: string; interest: number }>;
  topTracks: Array<{ id: number; title: string; plays: number }>;
};

type CatalogEvent = {
  id: number;
  title: string;
  place: string;
  city: string;
  eventDate: Date | string;
  canceledAt?: Date | string | null;
};

type ArtistCatalog = {
  tracks: SceneTrack[];
  events: CatalogEvent[];
};

type Library = {
  followedArtistIds?: number[];
  savedTrackIds?: number[];
  interestedEventIds?: number[];
  recentTrackIds?: number[];
  playlists?: Array<{ id: number; name: string; trackIds: number[] }>;
};

function dateLabel(value: Date | string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Data a confirmar";
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).replace(".", "");
}

export function AccountProfileView({ user, isArtist, artistProfile, artistStats, artistCatalog, library, onEdit, onUpload, onPlay, onShare, children }: { user: ProfileUser | null; isArtist: boolean; artistProfile?: ArtistProfile | null; artistStats?: ArtistStats | null; artistCatalog?: ArtistCatalog; library?: Library | null; onEdit: () => void; onUpload: () => void; onPlay: (track: SceneTrack) => void; onShare: () => void; children?: ReactNode }) {
  const displayName = isArtist && artistProfile ? artistProfile.name : user?.name || "Seu perfil";
  const city = isArtist && artistProfile ? artistProfile.city : user?.city || "Escolha sua cidade";
  const followedCount = library?.followedArtistIds?.length ?? 0;
  const savedCount = library?.savedTrackIds?.length ?? 0;
  const playlistCount = library?.playlists?.length ?? 0;
  const interestedCount = library?.interestedEventIds?.length ?? 0;
  const profileKind = isArtist ? (artistProfile?.profileType === "band" ? "Banda" : "Perfil de artista") : "Perfil de ouvinte";
  const tracks = artistCatalog?.tracks ?? [];
  const events = (artistCatalog?.events ?? []).filter(event => !event.canceledAt);

  return <>
    <section className={`account-hero ${isArtist ? "artist-account-hero" : "listener-account-hero"}`}>
      {isArtist && artistProfile?.coverUrl && <img className="account-hero-cover" src={artistProfile.coverUrl} alt="Capa do perfil artístico" />}
      <div className="account-hero-content">
        <div className="account-avatar-large">{isArtist && artistProfile?.avatarUrl ? <img src={artistProfile.avatarUrl} alt={`Foto de ${displayName}`} /> : isArtist ? <Disc3 size={32} /> : <Headphones size={32} />}</div>
        <div className="account-hero-copy"><span className="eyebrow lime">{profileKind}</span><h2>{displayName}</h2><span className="account-location"><MapPin size={14} /> {city}</span>{isArtist && artistProfile?.handle && <small>@{artistProfile.handle.replace(/^@/, "")}</small>}</div>
        <div className="account-hero-actions"><button className="primary-button" type="button" onClick={onEdit}><Edit3 size={15} /> Editar perfil</button>{isArtist && <button className="secondary-button" type="button" onClick={onUpload}><UploadCloud size={15} /> Nova faixa</button>}<button className="icon-button quiet" type="button" aria-label="Compartilhar perfil" onClick={onShare}><Share2 size={17} /></button></div>
      </div>
      <div className="account-profile-status"><span className="profile-status-dot" /><span>{isArtist ? `${tracks.length} faixa${tracks.length === 1 ? "" : "s"} publicada${tracks.length === 1 ? "" : "s"}` : "Seu radar local está ativo"}</span><span className="profile-status-separator">·</span><span>{isArtist ? `${artistStats?.followers ?? 0} seguidores` : `${followedCount} artistas seguindo`}</span></div>
    </section>

    <div className="profile-summary-grid">
      {isArtist ? <><div className="stat-card"><strong>{artistStats?.plays ?? 0}</strong><span>reproduções</span></div><div className="stat-card"><strong>{artistStats?.followers ?? 0}</strong><span>seguidores</span></div><div className="stat-card"><strong>{events.length}</strong><span>próximos shows</span></div></> : <><div className="stat-card"><strong>{followedCount}</strong><span>artistas seguidos</span></div><div className="stat-card"><strong>{savedCount}</strong><span>faixas salvas</span></div><div className="stat-card"><strong>{playlistCount}</strong><span>playlists</span></div><div className="stat-card"><strong>{interestedCount}</strong><span>eventos de interesse</span></div></>}
    </div>

    <div className="account-profile-columns">
      <section className="composer-card profile-section-card"><div className="section-title"><div><span className="eyebrow">sobre você</span><h3>{isArtist ? "A presença do projeto" : "Seu radar na cidade"}</h3></div></div><p className="profile-description">{isArtist ? artistProfile?.bio || "Adicione uma bio para contar de onde vem o seu som." : user?.publicBio || "Adicione uma bio para contar o que você gosta de encontrar na cena."}</p>{isArtist && artistProfile?.manifesto && <p className="profile-manifesto">“{artistProfile.manifesto}”</p>}{!isArtist && <div className="profile-links"><span><MapPin size={14} /> {city}</span><span>{user?.favoriteGenres || "Gêneros favoritos ainda não definidos"}</span></div>}</section>
      <section className="composer-card profile-section-card"><div className="section-title"><div><span className="eyebrow">atividade</span><h3>{isArtist ? "O que está acontecendo" : "Sua movimentação"}</h3></div></div>{isArtist ? <div className="activity-list"><div className="activity-item"><span className="activity-icon" style={{ background: "#c8f36a" }} /><div><strong>{tracks.length ? "Catálogo publicado" : "Seu catálogo começa aqui"}</strong><span>{tracks.length ? `${tracks.length} faixa${tracks.length === 1 ? "" : "s"} visível${tracks.length === 1 ? "" : "eis"} no perfil` : "Publique a primeira faixa para aparecer na cena."}</span></div></div><div className="activity-item"><span className="activity-icon" style={{ background: "#f78f7a" }} /><div><strong>{events.length ? "Agenda atualizada" : "Sem shows marcados"}</strong><span>{events.length ? `${events.length} encontro${events.length === 1 ? "" : "s"} próximo${events.length === 1 ? "" : "s"}` : "Crie um evento para avisar quem acompanha o projeto."}</span></div></div></div> : <div className="activity-list"><div className="activity-item"><span className="activity-icon" style={{ background: "#c8f36a" }} /><div><strong>{followedCount ? "Você está acompanhando a cena" : "Comece a seguir artistas"}</strong><span>{followedCount ? `${followedCount} artista${followedCount === 1 ? "" : "s"} no seu radar` : "Siga projetos para receber novos lançamentos."}</span></div></div><div className="activity-item"><span className="activity-icon" style={{ background: "#b8a7ff" }} /><div><strong>{interestedCount ? "Agenda salva" : "Nenhum evento salvo"}</strong><span>{interestedCount ? `${interestedCount} evento${interestedCount === 1 ? "" : "s"} de interesse` : "Marque interesse em um show para não esquecer."}</span></div></div></div>}</section>
    </div>

    {isArtist && <section className="content-section profile-content-section"><div className="section-title"><div><span className="eyebrow lime">lançamentos</span><h3>Músicas publicadas</h3></div><button className="ghost-button" type="button" onClick={onUpload}><UploadCloud size={15} /> Enviar faixa</button></div>{tracks.length ? <div className="profile-track-list">{tracks.map(track => <div className="profile-track-row" key={track.id}><img src={track.cover} alt="" /><div><strong>{track.title}</strong><span>{track.genre} · {track.city}</span></div><button className="icon-button quiet" type="button" aria-label={`Tocar ${track.title}`} onClick={() => onPlay(track)}><Play size={16} fill="currentColor" /></button></div>)}</div> : <div className="profile-empty-state"><Disc3 size={20} /><div><strong>Nenhuma faixa publicada ainda.</strong><span>A primeira música enviada aparecerá aqui, mesmo que você esteja vendo outra cidade na Home.</span></div><button className="primary-button" type="button" onClick={onUpload}>Publicar primeira faixa</button></div>}</section>}

    {isArtist && <section className="content-section profile-content-section"><div className="section-title"><div><span className="eyebrow coral">agenda</span><h3>Próximos eventos</h3></div><CalendarDays size={19} /></div>{events.length ? <div className="profile-event-list">{events.map(event => <div className="profile-event-row" key={event.id}><div className="profile-event-date"><strong>{new Date(event.eventDate).getDate()}</strong><span>{new Date(event.eventDate).toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}</span></div><div><strong>{event.title}</strong><span>{event.place} · {event.city} · {dateLabel(event.eventDate)}</span></div></div>)}</div> : <p className="empty-copy">Nenhum evento publicado. Use a agenda para marcar o próximo encontro.</p>}</section>}

    {children}
  </>;
}
