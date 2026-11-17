CREATE TABLE `mobileOAuthTickets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tokenHash` varchar(64) NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mobileOAuthTickets_id` PRIMARY KEY(`id`),
	CONSTRAINT `mobileOAuthTickets_tokenHash_unique` UNIQUE(`tokenHash`)
);
--> statement-breakpoint
CREATE INDEX `idx_mobile_oauth_tickets_expires_at` ON `mobileOAuthTickets` (`expiresAt`);