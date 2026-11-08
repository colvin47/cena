ALTER TABLE `tracks` ADD COLUMN `releaseDate` timestamp NULL AFTER `releaseType`;--> statement-breakpoint
ALTER TABLE `tracks` ADD COLUMN `visibility` enum('public','private') NOT NULL DEFAULT 'public' AFTER `releaseDate`;
