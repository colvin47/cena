import { and, asc, desc, eq, like, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  artists,
  eventInterests,
  events,
  follows,
  InsertUser,
  playlists,
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

export async function findArtists(searchTerm?: string, city?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (searchTerm) {
    const pattern = `%${searchTerm}%`;
    conditions.push(or(like(artists.name, pattern), like(artists.genre, pattern), like(artists.city, pattern)));
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
    conditions.push(or(like(tracks.title, pattern), like(tracks.album, pattern), like(tracks.genre, pattern), like(tracks.city, pattern)));
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
  }).from(events).innerJoin(artists, eq(events.artistId, artists.id)).where(city ? eq(events.city, city) : undefined).orderBy(asc(events.eventDate)).limit(50);
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

export async function createPlaylist(userId: number, name: string, collaborative: boolean) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(playlists).values({ ownerId: userId, name, collaborative });
  return Number(result[0].insertId);
}

export async function getUserLibrary(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const [followRows, interestRows, playlistRows] = await Promise.all([
    db.select({ artistId: follows.artistId }).from(follows).where(eq(follows.followerId, userId)),
    db.select({ eventId: eventInterests.eventId }).from(eventInterests).where(eq(eventInterests.userId, userId)),
    db.select({ id: playlists.id, name: playlists.name, collaborative: playlists.collaborative }).from(playlists).where(eq(playlists.ownerId, userId)).orderBy(desc(playlists.updatedAt)),
  ]);
  return {
    followedArtistIds: followRows.map(row => row.artistId),
    interestedEventIds: interestRows.map(row => row.eventId),
    playlists: playlistRows,
  };
}
