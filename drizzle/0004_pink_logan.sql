CREATE TABLE `collectiveMembers` (
	`collectiveId` int NOT NULL,
	`artistId` int NOT NULL,
	`memberRole` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `collectiveMembers_collectiveId_artistId_pk` PRIMARY KEY(`collectiveId`,`artistId`)
);
--> statement-breakpoint
CREATE TABLE `collectives` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`handle` varchar(80) NOT NULL,
	`type` enum('collective','label','venue','media','festival') NOT NULL DEFAULT 'collective',
	`city` varchar(120) NOT NULL,
	`bio` text,
	`manifesto` text,
	`imageUrl` text,
	`supportUrl` text,
	`pixUrl` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `collectives_id` PRIMARY KEY(`id`),
	CONSTRAINT `collectives_handle_unique` UNIQUE(`handle`)
);
--> statement-breakpoint
CREATE TABLE `moderationReports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reporterId` int NOT NULL,
	`targetType` enum('track','artist','event','collective') NOT NULL,
	`targetId` int NOT NULL,
	`reason` varchar(120) NOT NULL,
	`details` text,
	`status` enum('open','reviewed','resolved','rejected') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	CONSTRAINT `moderationReports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trackCredits` (
	`trackId` int NOT NULL,
	`creditName` varchar(160) NOT NULL,
	`creditRole` varchar(100) NOT NULL,
	`artistId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trackCredits_trackId_creditName_creditRole_pk` PRIMARY KEY(`trackId`,`creditName`,`creditRole`)
);
--> statement-breakpoint
ALTER TABLE `artists` ADD `profileType` enum('solo','band','mc','producer','dj','collective','label','venue') DEFAULT 'solo' NOT NULL;--> statement-breakpoint
ALTER TABLE `artists` ADD `manifesto` text;--> statement-breakpoint
ALTER TABLE `artists` ADD `supportUrl` text;--> statement-breakpoint
ALTER TABLE `artists` ADD `pixUrl` varchar(255);--> statement-breakpoint
ALTER TABLE `artists` ADD `merchUrl` text;--> statement-breakpoint
ALTER TABLE `artists` ADD `isVerified` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `events` ADD `eventType` enum('show','battle','cypher','cultural_round','diy_festival','occupation','zine_fair','workshop','listening_party','release') DEFAULT 'show' NOT NULL;--> statement-breakpoint
ALTER TABLE `events` ADD `admissionType` enum('ticket','free','contribution') DEFAULT 'ticket' NOT NULL;--> statement-breakpoint
ALTER TABLE `events` ADD `program` text;--> statement-breakpoint
ALTER TABLE `events` ADD `accessibility` text;--> statement-breakpoint
ALTER TABLE `events` ADD `safeSpace` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `events` ADD `ageRating` varchar(40);--> statement-breakpoint
ALTER TABLE `events` ADD `canceledAt` timestamp;--> statement-breakpoint
ALTER TABLE `events` ADD `cancelReason` text;--> statement-breakpoint
ALTER TABLE `tracks` ADD `releaseType` enum('single','album','demo','live','split','compilation') DEFAULT 'single' NOT NULL;--> statement-breakpoint
ALTER TABLE `tracks` ADD `creditsNote` text;--> statement-breakpoint
ALTER TABLE `collectiveMembers` ADD CONSTRAINT `collectiveMembers_collectiveId_collectives_id_fk` FOREIGN KEY (`collectiveId`) REFERENCES `collectives`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `collectiveMembers` ADD CONSTRAINT `collectiveMembers_artistId_artists_id_fk` FOREIGN KEY (`artistId`) REFERENCES `artists`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `collectives` ADD CONSTRAINT `collectives_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `moderationReports` ADD CONSTRAINT `moderationReports_reporterId_users_id_fk` FOREIGN KEY (`reporterId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trackCredits` ADD CONSTRAINT `trackCredits_trackId_tracks_id_fk` FOREIGN KEY (`trackId`) REFERENCES `tracks`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trackCredits` ADD CONSTRAINT `trackCredits_artistId_artists_id_fk` FOREIGN KEY (`artistId`) REFERENCES `artists`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_collective_members_artist` ON `collectiveMembers` (`artistId`);--> statement-breakpoint
CREATE INDEX `idx_collectives_city` ON `collectives` (`city`);--> statement-breakpoint
CREATE INDEX `idx_collectives_owner` ON `collectives` (`ownerId`);--> statement-breakpoint
CREATE INDEX `idx_reports_target` ON `moderationReports` (`targetType`,`targetId`);--> statement-breakpoint
CREATE INDEX `idx_reports_status` ON `moderationReports` (`status`);--> statement-breakpoint
CREATE INDEX `idx_track_credits_artist` ON `trackCredits` (`artistId`);--> statement-breakpoint
CREATE INDEX `idx_artists_profile_type` ON `artists` (`profileType`);--> statement-breakpoint
CREATE INDEX `idx_events_type` ON `events` (`eventType`);--> statement-breakpoint
CREATE INDEX `idx_tracks_release_type` ON `tracks` (`releaseType`);