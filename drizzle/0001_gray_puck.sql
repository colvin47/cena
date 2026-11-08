CREATE TABLE `artists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int,
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
	CONSTRAINT `artists_id` PRIMARY KEY(`id`),
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
	CONSTRAINT `playlists_id` PRIMARY KEY(`id`)
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
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tracks_id` PRIMARY KEY(`id`)
);
