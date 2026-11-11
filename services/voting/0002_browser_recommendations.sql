CREATE TABLE `browser_recommendations` (
	`browser_id` text NOT NULL,
	`brand` text NOT NULL,
	PRIMARY KEY(`browser_id`, `brand`)
);
--> statement-breakpoint
CREATE INDEX `browser_recommendations_brand_idx` ON `browser_recommendations` (`brand`);