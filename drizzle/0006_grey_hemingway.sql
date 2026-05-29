ALTER TABLE `tickets` ADD `fromCity` varchar(10);--> statement-breakpoint
ALTER TABLE `tickets` ADD `fromDistrict` varchar(10);--> statement-breakpoint
ALTER TABLE `tickets` ADD `toCity` varchar(10);--> statement-breakpoint
ALTER TABLE `tickets` ADD `toDistrict` varchar(10);--> statement-breakpoint
ALTER TABLE `tickets` ADD `fromHasElevator` enum('yes','no');--> statement-breakpoint
ALTER TABLE `tickets` ADD `fromFloor` int;--> statement-breakpoint
ALTER TABLE `tickets` ADD `toHasElevator` enum('yes','no');--> statement-breakpoint
ALTER TABLE `tickets` ADD `toFloor` int;