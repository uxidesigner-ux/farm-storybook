CREATE TABLE `brand_votes` (
	`request_id` text PRIMARY KEY NOT NULL,
	`brand` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `brand_votes_brand_idx` ON `brand_votes` (`brand`);