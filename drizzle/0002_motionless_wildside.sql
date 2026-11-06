CREATE TABLE `savedTracks` (
	`userId` int NOT NULL,
	`trackId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `savedTracks_userId_trackId_pk` PRIMARY KEY(`userId`,`trackId`)
);
--> statement-breakpoint
ALTER TABLE `savedTracks` ADD CONSTRAINT `savedTracks_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `savedTracks` ADD CONSTRAINT `savedTracks_trackId_tracks_id_fk` FOREIGN KEY (`trackId`) REFERENCES `tracks`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_saved_tracks_track` ON `savedTracks` (`trackId`);