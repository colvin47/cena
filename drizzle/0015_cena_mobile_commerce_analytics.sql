CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actorId` int NOT NULL,
	`action` varchar(120) NOT NULL,
	`targetType` varchar(40) NOT NULL,
	`targetId` int,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `collectiveInvites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`collectiveId` int NOT NULL,
	`inviterId` int NOT NULL,
	`tokenHash` varchar(128) NOT NULL,
	`permission` enum('editor','agenda','member') NOT NULL DEFAULT 'member',
	`email` varchar(320),
	`expiresAt` timestamp NOT NULL,
	`acceptedAt` timestamp,
	`declinedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `collectiveInvites_id` PRIMARY KEY(`id`),
	CONSTRAINT `collectiveInvites_tokenHash_unique` UNIQUE(`tokenHash`)
);
--> statement-breakpoint
CREATE TABLE `eventTickets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`price` decimal(10,2) NOT NULL DEFAULT '0.00',
	`quantityAvailable` int NOT NULL DEFAULT 0,
	`quantityReserved` int NOT NULL DEFAULT 0,
	`pixKey` varchar(255),
	`isAvailable` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `eventTickets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `merchandise` (
	`id` int AUTO_INCREMENT NOT NULL,
	`artistId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`description` text,
	`price` decimal(10,2) NOT NULL DEFAULT '0.00',
	`stock` int NOT NULL DEFAULT 0,
	`imageUrl` text,
	`externalUrl` text,
	`isAvailable` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `merchandise_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `collectiveMembers` ADD `permission` enum('owner','editor','agenda','member') DEFAULT 'member' NOT NULL;--> statement-breakpoint
ALTER TABLE `events` ADD `collectiveId` int;--> statement-breakpoint
ALTER TABLE `events` ADD `address` varchar(255);--> statement-breakpoint
ALTER TABLE `events` ADD `latitude` decimal(10,7);--> statement-breakpoint
ALTER TABLE `events` ADD `longitude` decimal(10,7);--> statement-breakpoint
ALTER TABLE `trackPlays` ADD `listenedSeconds` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `trackPlays` ADD `city` varchar(120);--> statement-breakpoint
ALTER TABLE `tracks` ADD `collectiveId` int;--> statement-breakpoint
ALTER TABLE `tracks` ADD `releaseDate` timestamp;--> statement-breakpoint
ALTER TABLE `tracks` ADD `visibility` enum('public','private') DEFAULT 'public' NOT NULL;--> statement-breakpoint
ALTER TABLE `tracks` ADD `sourceType` enum('upload','spotify','youtube','bandcamp','soundcloud') DEFAULT 'upload' NOT NULL;--> statement-breakpoint
ALTER TABLE `tracks` ADD `externalUrl` text;--> statement-breakpoint
ALTER TABLE `tracks` ADD `bookletPages` text;--> statement-breakpoint
ALTER TABLE `tracks` ADD `idempotencyKey` varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `adminRole` enum('owner','moderator','agenda') DEFAULT 'moderator' NOT NULL;--> statement-breakpoint
ALTER TABLE `tracks` ADD CONSTRAINT `tracks_idempotencyKey_unique` UNIQUE(`idempotencyKey`);--> statement-breakpoint
ALTER TABLE `auditLogs` ADD CONSTRAINT `auditLogs_actorId_users_id_fk` FOREIGN KEY (`actorId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `collectiveInvites` ADD CONSTRAINT `collectiveInvites_collectiveId_collectives_id_fk` FOREIGN KEY (`collectiveId`) REFERENCES `collectives`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `collectiveInvites` ADD CONSTRAINT `collectiveInvites_inviterId_users_id_fk` FOREIGN KEY (`inviterId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `eventTickets` ADD CONSTRAINT `eventTickets_eventId_events_id_fk` FOREIGN KEY (`eventId`) REFERENCES `events`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `merchandise` ADD CONSTRAINT `merchandise_artistId_artists_id_fk` FOREIGN KEY (`artistId`) REFERENCES `artists`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_audit_actor_date` ON `auditLogs` (`actorId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_audit_target` ON `auditLogs` (`targetType`,`targetId`);--> statement-breakpoint
CREATE INDEX `idx_collective_invites_collective` ON `collectiveInvites` (`collectiveId`);--> statement-breakpoint
CREATE INDEX `idx_collective_invites_token` ON `collectiveInvites` (`tokenHash`);--> statement-breakpoint
CREATE INDEX `idx_event_tickets_event_available` ON `eventTickets` (`eventId`,`isAvailable`);--> statement-breakpoint
CREATE INDEX `idx_merchandise_artist_available` ON `merchandise` (`artistId`,`isAvailable`);--> statement-breakpoint
ALTER TABLE `events` ADD CONSTRAINT `events_collectiveId_collectives_id_fk` FOREIGN KEY (`collectiveId`) REFERENCES `collectives`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tracks` ADD CONSTRAINT `tracks_collectiveId_collectives_id_fk` FOREIGN KEY (`collectiveId`) REFERENCES `collectives`(`id`) ON DELETE set null ON UPDATE no action;