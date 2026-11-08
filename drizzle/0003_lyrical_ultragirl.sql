CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`kind` enum('release','event','moderation','system') NOT NULL,
	`title` varchar(220) NOT NULL,
	`body` text NOT NULL,
	`href` varchar(255),
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `savedTracks` (
	`userId` int NOT NULL,
	`trackId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `savedTracks_userId_trackId_pk` PRIMARY KEY(`userId`,`trackId`)
);
--> statement-breakpoint
CREATE TABLE `trackPlays` (
	`id` int AUTO_INCREMENT NOT NULL,
	`trackId` int NOT NULL,
	`userId` int,
	`playedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trackPlays_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `artists` MODIFY COLUMN `ownerId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `artists` ADD `updatedAt` timestamp DEFAULT (now()) NOT NULL ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `events` ADD `updatedAt` timestamp DEFAULT (now()) NOT NULL ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `playlistTracks` ADD `position` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `playlists` ADD `updatedAt` timestamp DEFAULT (now()) NOT NULL ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `tracks` ADD `rightsDeclaredAt` timestamp;--> statement-breakpoint
ALTER TABLE `tracks` ADD `moderationStatus` enum('published','pending_review','takedown') DEFAULT 'published' NOT NULL;--> statement-breakpoint
ALTER TABLE `tracks` ADD `takedownReason` text;--> statement-breakpoint
ALTER TABLE `tracks` ADD `removedAt` timestamp;--> statement-breakpoint
ALTER TABLE `tracks` ADD `updatedAt` timestamp DEFAULT (now()) NOT NULL ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `users` ADD `city` varchar(120);--> statement-breakpoint
ALTER TABLE `users` ADD `favoriteGenres` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `publicBio` text;--> statement-breakpoint
ALTER TABLE `artists` ADD CONSTRAINT `artists_ownerId_unique` UNIQUE(`ownerId`);--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `savedTracks` ADD CONSTRAINT `savedTracks_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `savedTracks` ADD CONSTRAINT `savedTracks_trackId_tracks_id_fk` FOREIGN KEY (`trackId`) REFERENCES `tracks`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trackPlays` ADD CONSTRAINT `trackPlays_trackId_tracks_id_fk` FOREIGN KEY (`trackId`) REFERENCES `tracks`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trackPlays` ADD CONSTRAINT `trackPlays_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_notifications_user_date` ON `notifications` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_saved_tracks_track` ON `savedTracks` (`trackId`);--> statement-breakpoint
CREATE INDEX `idx_track_plays_track_date` ON `trackPlays` (`trackId`,`playedAt`);--> statement-breakpoint
CREATE INDEX `idx_track_plays_user_date` ON `trackPlays` (`userId`,`playedAt`);--> statement-breakpoint
ALTER TABLE `artists` ADD CONSTRAINT `artists_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `eventInterests` ADD CONSTRAINT `eventInterests_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `eventInterests` ADD CONSTRAINT `eventInterests_eventId_events_id_fk` FOREIGN KEY (`eventId`) REFERENCES `events`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `events` ADD CONSTRAINT `events_artistId_artists_id_fk` FOREIGN KEY (`artistId`) REFERENCES `artists`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `follows` ADD CONSTRAINT `follows_followerId_users_id_fk` FOREIGN KEY (`followerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `follows` ADD CONSTRAINT `follows_artistId_artists_id_fk` FOREIGN KEY (`artistId`) REFERENCES `artists`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `playlistTracks` ADD CONSTRAINT `playlistTracks_playlistId_playlists_id_fk` FOREIGN KEY (`playlistId`) REFERENCES `playlists`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `playlistTracks` ADD CONSTRAINT `playlistTracks_trackId_tracks_id_fk` FOREIGN KEY (`trackId`) REFERENCES `tracks`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `playlistTracks` ADD CONSTRAINT `playlistTracks_addedBy_users_id_fk` FOREIGN KEY (`addedBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `playlists` ADD CONSTRAINT `playlists_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tracks` ADD CONSTRAINT `tracks_artistId_artists_id_fk` FOREIGN KEY (`artistId`) REFERENCES `artists`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_artists_city` ON `artists` (`city`);--> statement-breakpoint
CREATE INDEX `idx_event_interests_event` ON `eventInterests` (`eventId`);--> statement-breakpoint
CREATE INDEX `idx_events_city_date` ON `events` (`city`,`eventDate`);--> statement-breakpoint
CREATE INDEX `idx_events_artist` ON `events` (`artistId`);--> statement-breakpoint
CREATE INDEX `idx_follows_artist` ON `follows` (`artistId`);--> statement-breakpoint
CREATE INDEX `idx_playlist_tracks_position` ON `playlistTracks` (`playlistId`,`position`);--> statement-breakpoint
CREATE INDEX `idx_playlists_owner` ON `playlists` (`ownerId`);--> statement-breakpoint
CREATE INDEX `idx_tracks_artist` ON `tracks` (`artistId`);--> statement-breakpoint
CREATE INDEX `idx_tracks_city_genre` ON `tracks` (`city`,`genre`);--> statement-breakpoint
CREATE INDEX `idx_tracks_created_at` ON `tracks` (`createdAt`);