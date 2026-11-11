import { sqliteTable, text, index, primaryKey } from 'drizzle-orm/sqlite-core';

// Historical anonymous votes are retained unchanged; current totals exclude them.
export const brandVotes = sqliteTable('brand_votes', { requestId: text('request_id').primaryKey(), brand: text('brand').notNull() }, table => [index('brand_votes_brand_idx').on(table.brand)]);

export const brandRecommendations = sqliteTable('brand_recommendations', {
  voterId: text('voter_id').notNull(),
  brand: text('brand').notNull(),
}, table => [primaryKey({ columns: [table.voterId, table.brand] }), index('brand_recommendations_brand_idx').on(table.brand)]);
