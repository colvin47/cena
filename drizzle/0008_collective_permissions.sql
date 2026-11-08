ALTER TABLE `collectiveMembers` ADD `permission` enum('owner','editor','agenda','member');--> statement-breakpoint
UPDATE `collectiveMembers` SET `permission` = 'member' WHERE `permission` IS NULL;--> statement-breakpoint
ALTER TABLE `collectiveMembers` MODIFY `permission` enum('owner','editor','agenda','member') NOT NULL DEFAULT 'member';--> statement-breakpoint
