import {
  boolean,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  primaryKey,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  accountType: mysqlEnum("accountType", ["listener", "artist"]).default("listener").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const artists = mysqlTable(
  "artists",
  {
    id: int("id").autoincrement().primaryKey(),
    ownerId: int("ownerId").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 160 }).notNull(),
    handle: varchar("handle", { length: 80 }).notNull().unique(),
    bio: text("bio"),
    genre: varchar("genre", { length: 80 }),
    city: varchar("city", { length: 120 }).notNull(),
    avatarUrl: text("avatarUrl"),
    coverUrl: text("coverUrl"),
    instagramUrl: text("instagramUrl"),
    bandcampUrl: text("bandcampUrl"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({ cityIdx: index("idx_artists_city").on(table.city) }),
);

export const tracks = mysqlTable(
  "tracks",
  {
    id: int("id").autoincrement().primaryKey(),
    artistId: int("artistId").notNull().references(() => artists.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 180 }).notNull(),
    album: varchar("album", { length: 180 }),
    genre: varchar("genre", { length: 80 }),
    // Cidade de gravação/publicação da faixa; pode diferir da cidade do artista.
    city: varchar("city", { length: 120 }).notNull(),
    description: text("description"),
    coverUrl: text("coverUrl"),
    audioUrl: text("audioUrl"),
    durationSeconds: int("durationSeconds"),
    rightsDeclared: boolean("rightsDeclared").default(false).notNull(),
    rightsDeclaredAt: timestamp("rightsDeclaredAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    artistIdx: index("idx_tracks_artist").on(table.artistId),
    cityGenreIdx: index("idx_tracks_city_genre").on(table.city, table.genre),
    createdAtIdx: index("idx_tracks_created_at").on(table.createdAt),
  }),
);

export const events = mysqlTable(
  "events",
  {
    id: int("id").autoincrement().primaryKey(),
    artistId: int("artistId").notNull().references(() => artists.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 180 }).notNull(),
    venue: varchar("venue", { length: 180 }).notNull(),
    city: varchar("city", { length: 120 }).notNull(),
    // Datas são persistidas em UTC e formatadas no fuso da interface.
    eventDate: timestamp("eventDate").notNull(),
    description: text("description"),
    ticketUrl: text("ticketUrl"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    cityDateIdx: index("idx_events_city_date").on(table.city, table.eventDate),
    artistIdx: index("idx_events_artist").on(table.artistId),
  }),
);

export const playlists = mysqlTable(
  "playlists",
  {
    id: int("id").autoincrement().primaryKey(),
    ownerId: int("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 160 }).notNull(),
    collaborative: boolean("collaborative").default(false).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({ ownerIdx: index("idx_playlists_owner").on(table.ownerId) }),
);

export const playlistTracks = mysqlTable(
  "playlistTracks",
  {
    playlistId: int("playlistId").notNull().references(() => playlists.id, { onDelete: "cascade" }),
    trackId: int("trackId").notNull().references(() => tracks.id, { onDelete: "cascade" }),
    addedBy: int("addedBy").references(() => users.id, { onDelete: "set null" }),
    position: int("position").notNull().default(0),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    pk: primaryKey({ columns: [table.playlistId, table.trackId] }),
    playlistPositionIdx: index("idx_playlist_tracks_position").on(table.playlistId, table.position),
  }),
);

export const follows = mysqlTable(
  "follows",
  {
    followerId: int("followerId").notNull().references(() => users.id, { onDelete: "cascade" }),
    artistId: int("artistId").notNull().references(() => artists.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    pk: primaryKey({ columns: [table.followerId, table.artistId] }),
    artistIdx: index("idx_follows_artist").on(table.artistId),
  }),
);

export const eventInterests = mysqlTable(
  "eventInterests",
  {
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    eventId: int("eventId").notNull().references(() => events.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    pk: primaryKey({ columns: [table.userId, table.eventId] }),
    eventIdx: index("idx_event_interests_event").on(table.eventId),
  }),
);

export const trackPlays = mysqlTable(
  "trackPlays",
  {
    id: int("id").autoincrement().primaryKey(),
    trackId: int("trackId").notNull().references(() => tracks.id, { onDelete: "cascade" }),
    userId: int("userId").references(() => users.id, { onDelete: "set null" }),
    playedAt: timestamp("playedAt").defaultNow().notNull(),
  },
  table => ({
    trackDateIdx: index("idx_track_plays_track_date").on(table.trackId, table.playedAt),
    userDateIdx: index("idx_track_plays_user_date").on(table.userId, table.playedAt),
  }),
);

export const savedTracks = mysqlTable(
  "savedTracks",
  {
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    trackId: int("trackId").notNull().references(() => tracks.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    pk: primaryKey({ columns: [table.userId, table.trackId] }),
    trackIdx: index("idx_saved_tracks_track").on(table.trackId),
  }),
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Artist = typeof artists.$inferSelect;
export type InsertArtist = typeof artists.$inferInsert;
export type Track = typeof tracks.$inferSelect;
export type InsertTrack = typeof tracks.$inferInsert;
export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;
export type Playlist = typeof playlists.$inferSelect;
export type InsertPlaylist = typeof playlists.$inferInsert;
export type PlaylistTrack = typeof playlistTracks.$inferSelect;
export type InsertPlaylistTrack = typeof playlistTracks.$inferInsert;
export type Follow = typeof follows.$inferSelect;
export type InsertFollow = typeof follows.$inferInsert;
export type EventInterest = typeof eventInterests.$inferSelect;
export type InsertEventInterest = typeof eventInterests.$inferInsert;
export type TrackPlay = typeof trackPlays.$inferSelect;
export type InsertTrackPlay = typeof trackPlays.$inferInsert;
export type SavedTrack = typeof savedTracks.$inferSelect;
export type InsertSavedTrack = typeof savedTracks.$inferInsert;
