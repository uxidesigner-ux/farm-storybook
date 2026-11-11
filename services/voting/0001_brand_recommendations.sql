CREATE TABLE `brand_recommendations` (
	`voter_id` text NOT NULL,
	`brand` text NOT NULL,
	PRIMARY KEY(`voter_id`, `brand`)
);
--> statement-breakpoint
CREATE INDEX `brand_recommendations_brand_idx` ON `brand_recommendations` (`brand`);