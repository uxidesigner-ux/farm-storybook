import { sqliteTable, text, index } from 'drizzle-orm/sqlite-core';
export const brandVotes = sqliteTable('brand_votes', { requestId: text('request_id').primaryKey(), brand: text('brand').notNull() }, table => [index('brand_votes_brand_idx').on(table.brand)]);
