CREATE TABLE `collectiveInvites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`collectiveId` int NOT NULL,
	`inviterId` int NOT NULL,
	`tokenHash` varchar(128) NOT NULL,
	`permission` enum('editor','agenda','member') NOT NULL DEFAULT 'member',
	`email` varchar(320),
	`expiresAt` timestamp NOT NULL,
	`acceptedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `collectiveInvites_id` PRIMARY KEY(`id`),
	CONSTRAINT `collectiveInvites_tokenHash_unique` UNIQUE(`tokenHash`)
);--> statement-breakpoint
ALTER TABLE `collectiveInvites` ADD CONSTRAINT `collectiveInvites_collectiveId_collectives_id_fk` FOREIGN KEY (`collectiveId`) REFERENCES `collectives`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `collectiveInvites` ADD CONSTRAINT `collectiveInvites_inviterId_users_id_fk` FOREIGN KEY (`inviterId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_collective_invites_collective` ON `collectiveInvites` (`collectiveId`);--> statement-breakpoint
CREATE INDEX `idx_collective_invites_token` ON `collectiveInvites` (`tokenHash`);--> statement-breakpoint
