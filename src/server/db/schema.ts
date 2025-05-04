import { sql } from "drizzle-orm";
import {
	index,
	integer,
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
