ALTER TABLE `tracks`
  ADD COLUMN `sourceType` enum('upload','spotify','youtube','bandcamp','soundcloud') NOT NULL DEFAULT 'upload' AFTER `visibility`;
--> statement-breakpoint
ALTER TABLE `tracks`
  ADD COLUMN `externalUrl` text NULL AFTER `sourceType`;
