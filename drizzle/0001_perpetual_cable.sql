CREATE TABLE `cases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(200) NOT NULL,
	`category` varchar(50),
	`challenge` text NOT NULL,
	`solution` text NOT NULL,
	`result` text NOT NULL,
	`feedback` text,
	`photoUrls` json,
	`coverPhoto` text,
	`region` enum('taipei','kaohsiung','both') DEFAULT 'taipei',
	`isPublished` boolean DEFAULT true,
	`sortOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`phone` varchar(20) NOT NULL,
	`email` varchar(320),
	`region` enum('taipei','kaohsiung'),
	`serviceType` varchar(100),
	`message` text,
	`isRead` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `contacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `faqs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category` varchar(50) NOT NULL,
	`question` text NOT NULL,
	`answer` text NOT NULL,
	`sortOrder` int DEFAULT 0,
	`isPublished` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `faqs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `news` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(200) NOT NULL,
	`title` varchar(300) NOT NULL,
	`metaDescription` varchar(160),
	`category` varchar(50),
	`content` text NOT NULL,
	`coverPhoto` text,
	`isPublished` boolean DEFAULT true,
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `news_id` PRIMARY KEY(`id`),
	CONSTRAINT `news_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `tickets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticketNo` varchar(32) NOT NULL,
	`region` enum('taipei','kaohsiung') NOT NULL,
	`status` enum('new','pending','quoted','contracted','scheduled','completed','archived') NOT NULL DEFAULT 'new',
	`customerName` varchar(100) NOT NULL,
	`customerPhone` varchar(20) NOT NULL,
	`customerLine` varchar(100),
	`customerEmail` varchar(320),
	`moveDate` timestamp,
	`fromAddress` text,
	`toAddress` text,
	`roomLayout` json,
	`aiResult` json,
	`photoUrls` json,
	`notes` text,
	`source` enum('ai_estimate','contact_form','phone','line') DEFAULT 'contact_form',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tickets_id` PRIMARY KEY(`id`),
	CONSTRAINT `tickets_ticketNo_unique` UNIQUE(`ticketNo`)
);
