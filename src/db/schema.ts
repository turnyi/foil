import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  summary: text('summary'),
  metadata: text('metadata', { mode: 'json' }).$type<Record<string, unknown>>(),
  totalTokens: integer('total_tokens').default(0).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

export const messages = sqliteTable('messages', {
  id: text('id').primaryKey(),
  sessionId: text('session_id')
    .notNull()
    .references(() => sessions.id, { onDelete: 'cascade' }),
  role: text('role', { enum: ['user', 'assistant', 'tool', 'system'] }).notNull(),
  status: text('status', { enum: ['active', 'finished', 'aborted', 'error'] }).default('active'),
  content: text('content', { mode: 'json' }).$type<unknown>().notNull(),
  reasoning: text('reasoning', { mode: 'json' }).$type<unknown>(),
  tokens: integer('tokens'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export type Session = typeof sessions.$inferSelect
export type NewSession = typeof sessions.$inferInsert
export type Message = typeof messages.$inferSelect
export type NewMessage = typeof messages.$inferInsert
