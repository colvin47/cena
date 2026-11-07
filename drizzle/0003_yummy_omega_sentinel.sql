CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`kind` enum('release','event','moderation','system') NOT NULL,
	`title` varchar(220) NOT NULL,
	`body` text NOT NULL,
	`href` varchar(255),
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `tracks` ADD `moderationStatus` enum('published','pending_review','takedown') DEFAULT 'published' NOT NULL;--> statement-breakpoint
ALTER TABLE `tracks` ADD `takedownReason` text;--> statement-breakpoint
ALTER TABLE `tracks` ADD `removedAt` timestamp;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_notifications_user_date` ON `notifications` (`userId`,`createdAt`);