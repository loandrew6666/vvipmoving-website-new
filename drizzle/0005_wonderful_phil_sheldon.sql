CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`userName` varchar(100) NOT NULL,
	`action` varchar(50) NOT NULL,
	`resourceType` varchar(50) NOT NULL,
	`resourceId` int NOT NULL,
	`oldValue` text,
	`newValue` text,
	`ipAddress` varchar(45) NOT NULL,
	`userAgent` text,
	`status` enum('success','failed','denied') NOT NULL DEFAULT 'success',
	`reason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ticket_sensitive` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticketId` int NOT NULL,
	`customerPhoneEncrypted` varchar(255) NOT NULL,
	`customerEmailEncrypted` varchar(255),
	`customerAddressEncrypted` text,
	`encryptionVersion` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ticket_sensitive_id` PRIMARY KEY(`id`),
	CONSTRAINT `ticket_sensitive_ticketId_unique` UNIQUE(`ticketId`),
	CONSTRAINT `idx_sensitive_ticketId` UNIQUE(`ticketId`)
);
--> statement-breakpoint
CREATE INDEX `idx_audit_userId` ON `audit_logs` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_audit_resourceType` ON `audit_logs` (`resourceType`);--> statement-breakpoint
CREATE INDEX `idx_audit_resourceId` ON `audit_logs` (`resourceId`);--> statement-breakpoint
CREATE INDEX `idx_audit_action` ON `audit_logs` (`action`);--> statement-breakpoint
CREATE INDEX `idx_audit_createdAt` ON `audit_logs` (`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_audit_userId_createdAt` ON `audit_logs` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_audit_resourceType_createdAt` ON `audit_logs` (`resourceType`,`createdAt`);