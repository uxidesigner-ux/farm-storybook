import { sqliteTable, text, index, primaryKey } from 'drizzle-orm/sqlite-core';

// Historical anonymous votes are retained unchanged; current totals exclude them.
export const brandVotes = sqliteTable('brand_votes', { requestId: text('request_id').primaryKey(), brand: text('brand').notNull() }, table => [index('brand_votes_brand_idx').on(table.brand)]);

export const brandRecommendations = sqliteTable('brand_recommendations', {
  voterId: text('voter_id').notNull(),
  brand: text('brand').notNull(),
}, table => [primaryKey({ columns: [table.voterId, table.brand] }), index('brand_recommendations_brand_idx').on(table.brand)]);

// Existing account recommendations above remain in totals. New votes use a
// persisted browser ID and can only add or remove that browser's own row.
export const browserRecommendations = sqliteTable('browser_recommendations', {
  browserId: text('browser_id').notNull(),
  brand: text('brand').notNull(),
}, table => [primaryKey({ columns: [table.browserId, table.brand] }), index('browser_recommendations_brand_idx').on(table.brand)]);
