ALTER TABLE `users` ADD `adminRole` enum('owner','moderator','agenda');--> statement-breakpoint
UPDATE `users` SET `adminRole` = CASE WHEN `role` = 'admin' THEN 'owner' ELSE 'moderator' END WHERE `adminRole` IS NULL;--> statement-breakpoint
ALTER TABLE `users` MODIFY `adminRole` enum('owner','moderator','agenda') NOT NULL DEFAULT 'moderator';--> statement-breakpoint
