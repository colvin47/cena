CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actorId` int NOT NULL,
	`action` varchar(120) NOT NULL,
	`targetType` varchar(40) NOT NULL,
	`targetId` int,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);--> statement-breakpoint
ALTER TABLE `auditLogs` ADD CONSTRAINT `auditLogs_actorId_users_id_fk` FOREIGN KEY (`actorId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_audit_actor_date` ON `auditLogs` (`actorId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_audit_target` ON `auditLogs` (`targetType`,`targetId`);--> statement-breakpoint
