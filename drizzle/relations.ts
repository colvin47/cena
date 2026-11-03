import { relations } from "drizzle-orm";
import {
  artists,
  eventInterests,
  events,
  follows,
  playlistTracks,
  playlists,
  trackPlays,
  tracks,
  users,
} from "./schema";

export const usersRelations = relations(users, ({ one, many }) => ({
  artist: one(artists, { fields: [users.id], references: [artists.ownerId] }),
  playlists: many(playlists),
  follows: many(follows),
  eventInterests: many(eventInterests),
  trackPlays: many(trackPlays),
}));

export const artistsRelations = relations(artists, ({ one, many }) => ({
  owner: one(users, { fields: [artists.ownerId], references: [users.id] }),
  tracks: many(tracks),
  events: many(events),
  followers: many(follows),
}));

export const tracksRelations = relations(tracks, ({ one, many }) => ({
  artist: one(artists, { fields: [tracks.artistId], references: [artists.id] }),
  playlistTracks: many(playlistTracks),
  plays: many(trackPlays),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  artist: one(artists, { fields: [events.artistId], references: [artists.id] }),
  interests: many(eventInterests),
}));

export const playlistsRelations = relations(playlists, ({ one, many }) => ({
  owner: one(users, { fields: [playlists.ownerId], references: [users.id] }),
  tracks: many(playlistTracks),
}));

export const playlistTracksRelations = relations(playlistTracks, ({ one }) => ({
  playlist: one(playlists, { fields: [playlistTracks.playlistId], references: [playlists.id] }),
  track: one(tracks, { fields: [playlistTracks.trackId], references: [tracks.id] }),
  addedByUser: one(users, { fields: [playlistTracks.addedBy], references: [users.id] }),
}));

export const followsRelations = relations(follows, ({ one }) => ({
  follower: one(users, { fields: [follows.followerId], references: [users.id] }),
  artist: one(artists, { fields: [follows.artistId], references: [artists.id] }),
}));

export const eventInterestsRelations = relations(eventInterests, ({ one }) => ({
  user: one(users, { fields: [eventInterests.userId], references: [users.id] }),
  event: one(events, { fields: [eventInterests.eventId], references: [events.id] }),
}));

export const trackPlaysRelations = relations(trackPlays, ({ one }) => ({
  track: one(tracks, { fields: [trackPlays.trackId], references: [tracks.id] }),
  user: one(users, { fields: [trackPlays.userId], references: [users.id] }),
}));
