CREATE TABLE `artists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`handle` varchar(80) NOT NULL,
	`bio` text,
	`genre` varchar(80),
	`city` varchar(120) NOT NULL,
	`avatarUrl` text,
	`coverUrl` text,
	`instagramUrl` text,
	`bandcampUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `artists_id` PRIMARY KEY(`id`),
	CONSTRAINT `artists_ownerId_unique` UNIQUE(`ownerId`),
	CONSTRAINT `artists_handle_unique` UNIQUE(`handle`)
);
--> statement-breakpoint
CREATE TABLE `eventInterests` (
	`userId` int NOT NULL,
	`eventId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `eventInterests_userId_eventId_pk` PRIMARY KEY(`userId`,`eventId`)
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`artistId` int NOT NULL,
	`name` varchar(180) NOT NULL,
	`venue` varchar(180) NOT NULL,
	`city` varchar(120) NOT NULL,
	`eventDate` timestamp NOT NULL,
	`description` text,
	`ticketUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `follows` (
	`followerId` int NOT NULL,
	`artistId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `follows_followerId_artistId_pk` PRIMARY KEY(`followerId`,`artistId`)
);
--> statement-breakpoint
CREATE TABLE `playlistTracks` (
	`playlistId` int NOT NULL,
	`trackId` int NOT NULL,
	`addedBy` int,
	`position` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `playlistTracks_playlistId_trackId_pk` PRIMARY KEY(`playlistId`,`trackId`)
);
--> statement-breakpoint
CREATE TABLE `playlists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`collaborative` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `playlists_id` PRIMARY KEY(`id`)
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
CREATE TABLE `tracks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`artistId` int NOT NULL,
	`title` varchar(180) NOT NULL,
	`album` varchar(180),
	`genre` varchar(80),
	`city` varchar(120) NOT NULL,
	`description` text,
	`coverUrl` text,
	`audioUrl` text,
	`durationSeconds` int,
	`rightsDeclared` boolean NOT NULL DEFAULT false,
	`rightsDeclaredAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tracks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `accountType` enum('listener','artist') DEFAULT 'listener' NOT NULL;--> statement-breakpoint
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
ALTER TABLE `trackPlays` ADD CONSTRAINT `trackPlays_trackId_tracks_id_fk` FOREIGN KEY (`trackId`) REFERENCES `tracks`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trackPlays` ADD CONSTRAINT `trackPlays_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tracks` ADD CONSTRAINT `tracks_artistId_artists_id_fk` FOREIGN KEY (`artistId`) REFERENCES `artists`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_artists_city` ON `artists` (`city`);--> statement-breakpoint
CREATE INDEX `idx_event_interests_event` ON `eventInterests` (`eventId`);--> statement-breakpoint
CREATE INDEX `idx_events_city_date` ON `events` (`city`,`eventDate`);--> statement-breakpoint
CREATE INDEX `idx_events_artist` ON `events` (`artistId`);--> statement-breakpoint
CREATE INDEX `idx_follows_artist` ON `follows` (`artistId`);--> statement-breakpoint
CREATE INDEX `idx_playlist_tracks_position` ON `playlistTracks` (`playlistId`,`position`);--> statement-breakpoint
CREATE INDEX `idx_playlists_owner` ON `playlists` (`ownerId`);--> statement-breakpoint
CREATE INDEX `idx_track_plays_track_date` ON `trackPlays` (`trackId`,`playedAt`);--> statement-breakpoint
CREATE INDEX `idx_track_plays_user_date` ON `trackPlays` (`userId`,`playedAt`);--> statement-breakpoint
CREATE INDEX `idx_tracks_artist` ON `tracks` (`artistId`);--> statement-breakpoint
CREATE INDEX `idx_tracks_city_genre` ON `tracks` (`city`,`genre`);--> statement-breakpoint
CREATE INDEX `idx_tracks_created_at` ON `tracks` (`createdAt`);