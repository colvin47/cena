ALTER TABLE `tracks` ADD `idempotencyKey` varchar(64);--> statement-breakpoint
UPDATE `tracks` SET `idempotencyKey` = CONCAT('legacy-', `id`) WHERE `idempotencyKey` IS NULL;--> statement-breakpoint
ALTER TABLE `tracks` MODIFY `idempotencyKey` varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE `tracks` ADD CONSTRAINT `tracks_idempotencyKey_unique` UNIQUE (`idempotencyKey`);--> statement-breakpoint
