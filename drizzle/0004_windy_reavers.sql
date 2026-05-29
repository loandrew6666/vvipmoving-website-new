CREATE TABLE `chat_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticketId` int NOT NULL,
	`role` enum('customer','admin') NOT NULL,
	`message` text NOT NULL,
	`imageUrl` text,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chat_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `registrations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`name` varchar(100),
	`phone` varchar(20),
	`source` varchar(50),
	`ipAddress` varchar(45),
	`userAgent` text,
	`status` enum('pending','verified','rejected') NOT NULL DEFAULT 'pending',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `registrations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ticket_ai_results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticketId` int NOT NULL,
	`photoCount` int DEFAULT 0,
	`furnitureCount` int DEFAULT 0,
	`truckCount` float DEFAULT 0,
	`priceMin` int DEFAULT 0,
	`priceMax` int DEFAULT 0,
	`estimateNote` text,
	`detectedItems` json,
	`roomSummaries` json,
	`riskItems` json,
	`invalidPhotos` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ticket_ai_results_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ticket_files` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticketId` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileType` varchar(100) NOT NULL,
	`url` text NOT NULL,
	`fileSize` int DEFAULT 0,
	`extractedFiles` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ticket_files_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ticket_photos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticketId` int NOT NULL,
	`url` text NOT NULL,
	`room` varchar(50),
	`sortOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ticket_photos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ticket_room_layouts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticketId` int NOT NULL,
	`roomType` varchar(50) NOT NULL,
	`count` int NOT NULL DEFAULT 0,
	CONSTRAINT `ticket_room_layouts_id` PRIMARY KEY(`id`),
	CONSTRAINT `idx_roomLayouts_ticket_room` UNIQUE(`ticketId`,`roomType`)
);
--> statement-breakpoint
ALTER TABLE `tickets` ADD `isEncrypted` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `tickets` ADD `encryptionVersion` int DEFAULT 1;--> statement-breakpoint
CREATE INDEX `idx_chat_ticketId` ON `chat_messages` (`ticketId`);--> statement-breakpoint
CREATE INDEX `idx_chat_role` ON `chat_messages` (`role`);--> statement-breakpoint
CREATE INDEX `idx_chat_isRead` ON `chat_messages` (`isRead`);--> statement-breakpoint
CREATE INDEX `idx_chat_createdAt` ON `chat_messages` (`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_chat_ticketId_isRead` ON `chat_messages` (`ticketId`,`isRead`);--> statement-breakpoint
CREATE INDEX `idx_chat_ticketId_createdAt` ON `chat_messages` (`ticketId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_registrations_email` ON `registrations` (`email`);--> statement-breakpoint
CREATE INDEX `idx_registrations_status` ON `registrations` (`status`);--> statement-breakpoint
CREATE INDEX `idx_registrations_ipAddress` ON `registrations` (`ipAddress`);--> statement-breakpoint
CREATE INDEX `idx_registrations_createdAt` ON `registrations` (`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_aiResults_ticketId` ON `ticket_ai_results` (`ticketId`);--> statement-breakpoint
CREATE INDEX `idx_aiResults_truckCount` ON `ticket_ai_results` (`truckCount`);--> statement-breakpoint
CREATE INDEX `idx_aiResults_priceMin` ON `ticket_ai_results` (`priceMin`);--> statement-breakpoint
CREATE INDEX `idx_files_ticketId` ON `ticket_files` (`ticketId`);--> statement-breakpoint
CREATE INDEX `idx_files_fileType` ON `ticket_files` (`fileType`);--> statement-breakpoint
CREATE INDEX `idx_photos_ticketId` ON `ticket_photos` (`ticketId`);--> statement-breakpoint
CREATE INDEX `idx_photos_room` ON `ticket_photos` (`room`);--> statement-breakpoint
CREATE INDEX `idx_roomLayouts_ticketId` ON `ticket_room_layouts` (`ticketId`);--> statement-breakpoint
CREATE INDEX `idx_cases_category` ON `cases` (`category`);--> statement-breakpoint
CREATE INDEX `idx_cases_region` ON `cases` (`region`);--> statement-breakpoint
CREATE INDEX `idx_cases_isPublished` ON `cases` (`isPublished`);--> statement-breakpoint
CREATE INDEX `idx_contacts_isRead` ON `contacts` (`isRead`);--> statement-breakpoint
CREATE INDEX `idx_contacts_region` ON `contacts` (`region`);--> statement-breakpoint
CREATE INDEX `idx_contacts_createdAt` ON `contacts` (`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_faqs_category` ON `faqs` (`category`);--> statement-breakpoint
CREATE INDEX `idx_faqs_isPublished` ON `faqs` (`isPublished`);--> statement-breakpoint
CREATE INDEX `idx_faqs_sortOrder` ON `faqs` (`sortOrder`);--> statement-breakpoint
CREATE INDEX `idx_news_category` ON `news` (`category`);--> statement-breakpoint
CREATE INDEX `idx_news_isPublished` ON `news` (`isPublished`);--> statement-breakpoint
CREATE INDEX `idx_news_publishedAt` ON `news` (`publishedAt`);--> statement-breakpoint
CREATE INDEX `idx_tickets_status` ON `tickets` (`status`);--> statement-breakpoint
CREATE INDEX `idx_tickets_region` ON `tickets` (`region`);--> statement-breakpoint
CREATE INDEX `idx_tickets_customerPhone` ON `tickets` (`customerPhone`);--> statement-breakpoint
CREATE INDEX `idx_tickets_customerIp` ON `tickets` (`customerIp`);--> statement-breakpoint
CREATE INDEX `idx_tickets_createdAt` ON `tickets` (`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_tickets_updatedAt` ON `tickets` (`updatedAt`);--> statement-breakpoint
CREATE INDEX `idx_tickets_source` ON `tickets` (`source`);--> statement-breakpoint
CREATE INDEX `idx_tickets_region_status` ON `tickets` (`region`,`status`);--> statement-breakpoint
CREATE INDEX `idx_tickets_status_createdAt` ON `tickets` (`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_users_role` ON `users` (`role`);--> statement-breakpoint
CREATE INDEX `idx_users_createdAt` ON `users` (`createdAt`);