import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "drizzle-kit";

// 获取本地D1数据库文件路径
function getLocalD1DB() {
	try {
		const basePath = path.resolve(".wrangler");
		const dbFile = fs
			.readdirSync(basePath, { encoding: "utf-8", recursive: true })
			.find((f) => f.endsWith(".sqlite"));

		if (!dbFile) {
			console.log(`找不到.sqlite文件，在${basePath}目录下`);
			return undefined;
		}

		return path.resolve(basePath, dbFile);
	} catch (err) {
		console.log(`出错: ${err}`);
		return undefined;
	}
}

// 检测是否在本地环境
const isLocal =
	process.env.NODE_ENV === "development" ||
	process.argv.includes("--local") ||
	!process.env.CLOUDFLARE_ACCOUNT_ID;

export default defineConfig({
	schema: "./src/server/db/schema.ts",
	out: "./drizzle",
	dialect: "sqlite",
	...(isLocal
		? {
				// 本地开发使用找到的SQLite文件
				dbCredentials: {
					url: getLocalD1DB(),
				},
			}
		: {
				// 生产环境使用D1 HTTP API
				driver: "d1-http",
				dbCredentials: {
					accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
					databaseId: process.env.CLOUDFLARE_DATABASE_ID,
					token: process.env.CLOUDFLARE_D1_TOKEN,
				},
			}),
});
