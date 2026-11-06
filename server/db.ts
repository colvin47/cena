import { and, asc, count, desc, eq, gte, like, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  artists,
  eventInterests,
  events,
  follows,
  InsertUser,
  playlistTracks,
  playlists,
  savedTracks,
  trackPlays,
  tracks,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;

  for (const field of textFields) {
    if (user[field] !== undefined) {
      const value = user[field] ?? null;
      values[field] = value;
      updateSet[field] = value;
    }
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (user.accountType !== undefined) {
    values.accountType = user.accountType;
    updateSet.accountType = user.accountType;
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function setAccountType(userId: number, accountType: "listener" | "artist") {
  const db = await getDb();
  if (!db) return false;
  await db.update(users).set({ accountType, updatedAt: new Date() }).where(eq(users.id, userId));
  return true;
}

export async function getArtistByOwnerId(ownerId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(artists).where(eq(artists.ownerId, ownerId)).limit(1);
  return result[0];
}

export async function createArtistProfile(ownerId: number, input: { name: string; handle: string; city: string; genre?: string; bio?: string }) {
  const db = await getDb();
  if (!db) return null;
  const existing = await getArtistByOwnerId(ownerId);
  if (existing) return existing;
  const result = await db.insert(artists).values({ ownerId, name: input.name, handle: input.handle, city: input.city, genre: input.genre || null, bio: input.bio || null });
  const created = await db.select().from(artists).where(eq(artists.id, Number(result[0].insertId))).limit(1);
  return created[0] ?? null;
}

export async function findArtists(searchTerm?: string, city?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (searchTerm) {
    const pattern = `%${searchTerm}%`;
    conditions.push(or(like(artists.name, pattern), like(artists.handle, pattern), like(artists.genre, pattern), like(artists.city, pattern)));
  }
  if (city) conditions.push(eq(artists.city, city));
  return db.select().from(artists).where(conditions.length ? and(...conditions) : undefined).orderBy(asc(artists.name)).limit(50);
}

export async function findTracks(searchTerm?: string, genre?: string, city?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (searchTerm) {
    const pattern = `%${searchTerm}%`;
    conditions.push(or(like(tracks.title, pattern), like(tracks.album, pattern), like(tracks.genre, pattern), like(tracks.city, pattern), like(artists.name, pattern), like(artists.handle, pattern)));
  }
  if (genre && genre !== "Tudo") conditions.push(eq(tracks.genre, genre));
  if (city) conditions.push(eq(tracks.city, city));
  return db.select({
    id: tracks.id,
    title: tracks.title,
    artistId: tracks.artistId,
    genre: tracks.genre,
    city: tracks.city,
    duration: tracks.durationSeconds,
    cover: tracks.coverUrl,
    audioUrl: tracks.audioUrl,
    artist: artists.name,
  }).from(tracks).innerJoin(artists, eq(tracks.artistId, artists.id)).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(tracks.createdAt)).limit(50);
}

export async function listEvents(city?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [gte(events.eventDate, new Date())];
  if (city) conditions.push(eq(events.city, city));
  return db.select({
    id: events.id,
    title: events.name,
    place: events.venue,
    city: events.city,
    eventDate: events.eventDate,
    description: events.description,
    ticketUrl: events.ticketUrl,
    artistId: events.artistId,
    artist: artists.name,
    interest: count(eventInterests.eventId),
  }).from(events).innerJoin(artists, eq(events.artistId, artists.id)).leftJoin(eventInterests, eq(eventInterests.eventId, events.id)).where(and(...conditions)).groupBy(events.id, artists.name).orderBy(asc(events.eventDate)).limit(50);
}

export async function toggleFollow(userId: number, artistId: number) {
  const db = await getDb();
  if (!db) return false;
  const existing = await db.select().from(follows).where(and(eq(follows.followerId, userId), eq(follows.artistId, artistId))).limit(1);
  if (existing.length) {
    await db.delete(follows).where(and(eq(follows.followerId, userId), eq(follows.artistId, artistId)));
    return false;
  }
  await db.insert(follows).values({ followerId: userId, artistId });
  return true;
}

export async function toggleEventInterest(userId: number, eventId: number) {
  const db = await getDb();
  if (!db) return false;
  const existing = await db.select().from(eventInterests).where(and(eq(eventInterests.userId, userId), eq(eventInterests.eventId, eventId))).limit(1);
  if (existing.length) {
    await db.delete(eventInterests).where(and(eq(eventInterests.userId, userId), eq(eventInterests.eventId, eventId)));
    return false;
  }
  await db.insert(eventInterests).values({ userId, eventId });
  return true;
}

export async function recordTrackPlay(trackId: number, userId?: number) {
  const db = await getDb();
  if (!db) return false;
  await db.insert(trackPlays).values({ trackId, userId: userId ?? null });
  return true;
}

export async function toggleSavedTrack(userId: number, trackId: number) {
  const db = await getDb();
  if (!db) return { saved: false, persisted: false };
  const track = await db.select({ id: tracks.id }).from(tracks).where(eq(tracks.id, trackId)).limit(1);
  if (!track[0]) return { saved: false, persisted: true, missing: true };
  const existing = await db.select().from(savedTracks).where(and(eq(savedTracks.userId, userId), eq(savedTracks.trackId, trackId))).limit(1);
  if (existing.length) {
    await db.delete(savedTracks).where(and(eq(savedTracks.userId, userId), eq(savedTracks.trackId, trackId)));
    return { saved: false, persisted: true };
  }
  await db.insert(savedTracks).values({ userId, trackId });
  return { saved: true, persisted: true };
}

export async function createPlaylist(userId: number, name: string, collaborative: boolean) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(playlists).values({ ownerId: userId, name, collaborative });
  return Number(result[0].insertId);
}

export async function addTrackToPlaylist(userId: number, playlistId: number, trackId: number) {
  const db = await getDb();
  if (!db) return { ok: false as const, reason: "DATABASE" as const };
  const playlist = await db.select({ ownerId: playlists.ownerId, collaborative: playlists.collaborative }).from(playlists).where(eq(playlists.id, playlistId)).limit(1);
  if (!playlist[0]) return { ok: false as const, reason: "NOT_FOUND" as const };
  if (playlist[0].ownerId !== userId && !playlist[0].collaborative) return { ok: false as const, reason: "FORBIDDEN" as const };
  const track = await db.select({ id: tracks.id }).from(tracks).where(eq(tracks.id, trackId)).limit(1);
  if (!track[0]) return { ok: false as const, reason: "TRACK_NOT_FOUND" as const };
  const existing = await db.select().from(playlistTracks).where(and(eq(playlistTracks.playlistId, playlistId), eq(playlistTracks.trackId, trackId))).limit(1);
  if (existing.length) return { ok: true as const, added: false };
  const last = await db.select({ position: playlistTracks.position }).from(playlistTracks).where(eq(playlistTracks.playlistId, playlistId)).orderBy(desc(playlistTracks.position)).limit(1);
  await db.insert(playlistTracks).values({ playlistId, trackId, addedBy: userId, position: (last[0]?.position ?? -1) + 1 });
  await db.update(playlists).set({ updatedAt: new Date() }).where(eq(playlists.id, playlistId));
  return { ok: true as const, added: true };
}

export async function getUserLibrary(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const [followRows, interestRows, playlistRows, savedRows] = await Promise.all([
    db.select({ artistId: follows.artistId }).from(follows).where(eq(follows.followerId, userId)),
    db.select({ eventId: eventInterests.eventId }).from(eventInterests).where(eq(eventInterests.userId, userId)),
    db.select({ id: playlists.id, name: playlists.name, collaborative: playlists.collaborative }).from(playlists).where(eq(playlists.ownerId, userId)).orderBy(desc(playlists.updatedAt)),
    db.select({ trackId: savedTracks.trackId }).from(savedTracks).where(eq(savedTracks.userId, userId)),
  ]);
  const playlistsWithTracks = await Promise.all(playlistRows.map(async playlist => {
    const rows = await db.select({ trackId: playlistTracks.trackId }).from(playlistTracks).where(eq(playlistTracks.playlistId, playlist.id)).orderBy(asc(playlistTracks.position));
    return { ...playlist, trackIds: rows.map(row => row.trackId) };
  }));
  return {
    followedArtistIds: followRows.map(row => row.artistId),
    interestedEventIds: interestRows.map(row => row.eventId),
    savedTrackIds: savedRows.map(row => row.trackId),
    playlists: playlistsWithTracks,
  };
}
