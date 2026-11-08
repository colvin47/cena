ALTER TABLE `tracks` ADD `collectiveId` int;--> statement-breakpoint
ALTER TABLE `events` ADD `collectiveId` int;--> statement-breakpoint
ALTER TABLE `tracks` ADD CONSTRAINT `tracks_collectiveId_collectives_id_fk` FOREIGN KEY (`collectiveId`) REFERENCES `collectives`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `events` ADD CONSTRAINT `events_collectiveId_collectives_id_fk` FOREIGN KEY (`collectiveId`) REFERENCES `collectives`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_tracks_collective` ON `tracks` (`collectiveId`);--> statement-breakpoint
CREATE INDEX `idx_events_collective` ON `events` (`collectiveId`);--> statement-breakpoint
