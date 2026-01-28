import { pgTable, serial, integer, text } from 'drizzle-orm/pg-core';

export const user = pgTable('user', { id: serial('id').primaryKey(), age: integer('age') });

export const sectors = pgTable('sectors', {
    id: text('id').primaryKey(),
    name: text('name').notNull()
});
