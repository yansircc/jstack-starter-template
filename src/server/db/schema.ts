import { sql } from "drizzle-orm";
import {
	index,
	integer,
	primaryKey,
	sqliteTableCreator,
	text,
} from "drizzle-orm/sqlite-core";

const sqliteTable = sqliteTableCreator((name) => `${name}_table`);

// 定义业务表
export const posts = sqliteTable(
	"posts",
	{
		id: integer("id").primaryKey(),
		name: text("name").notNull(),
		createdAt: integer("createdAt", { mode: "timestamp" })
			.default(sql`(cast((julianday('now') - 2440587.5)*86400000 as integer))`)
			.notNull(),
		updatedAt: integer("updatedAt", { mode: "timestamp" })
			.default(sql`(cast((julianday('now') - 2440587.5)*86400000 as integer))`)
			.notNull(),
	},
	(table) => [index("Post_name_idx").on(table.name)],
);

// Auth.js 所需的表
export const users = sqliteTable("user", {
	id: text("id").primaryKey(),
	name: text("name"),
	email: text("email").notNull(),
	emailVerified: integer("emailVerified", { mode: "timestamp" }),
	image: text("image"),
});

export const accounts = sqliteTable(
	"account",
	{
		userId: text("userId")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		type: text("type").notNull(),
		provider: text("provider").notNull(),
		providerAccountId: text("providerAccountId").notNull(),
		refresh_token: text("refresh_token"),
		access_token: text("access_token"),
		expires_at: integer("expires_at"),
		token_type: text("token_type"),
		scope: text("scope"),
		id_token: text("id_token"),
		session_state: text("session_state"),
	},
	(account) => [
		primaryKey({ columns: [account.provider, account.providerAccountId] }),
	],
);

export const sessions = sqliteTable("session", {
	sessionToken: text("sessionToken").primaryKey(),
	userId: text("userId")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	expires: integer("expires", { mode: "timestamp" }).notNull(),
});
