import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../server/db/schema";

async function cleanDatabase() {
	console.log("🧹 Starting database clean...");

	// Create a direct connection for this script only
	const connectionString = process.env.DATABASE_URL;
	if (!connectionString) {
		console.error("❌ DATABASE_URL environment variable is not set");
		process.exit(1);
	}

	// Connect directly in this script (not using the shared db instance)
	const client = postgres(connectionString);
	const db = drizzle(client, { schema });

	try {
		// Method 1: Drop and recreate schema (radical approach)
		console.log("Dropping and recreating the public schema...");
		try {
			await db.execute(sql`DROP SCHEMA public CASCADE`);
			await db.execute(sql`CREATE SCHEMA public`);
			await db.execute(sql`GRANT ALL ON SCHEMA public TO public`);
			console.log("✅ Public schema dropped and recreated successfully");
		} catch (error) {
			console.error("❌ Error dropping/recreating schema:", error);
			throw error;
		}

		// Method 2: Truncate specific tables (gentler approach)
		// Uncomment the following to use instead of the schema recreation approach
		/*
		console.log("Truncating tables...");
		try {
			// Truncate all tables - add more tables as needed
			await db.execute(sql`TRUNCATE TABLE ${schema.posts} RESTART IDENTITY CASCADE`);
			console.log("✅ Tables truncated successfully");
		} catch (error) {
			console.error("❌ Error truncating tables:", error);
			throw error;
		}
		*/

		console.log("🎉 Database cleaned successfully");
	} catch (error) {
		console.error("❌ Database clean failed:", error);
		process.exit(1);
	} finally {
		// Important: Close the client when done
		await client.end();
	}
}

// Run the clean function
cleanDatabase()
	.then(() => {
		console.log("✅ Database clean completed");
		process.exit(0);
	})
	.catch((error) => {
		console.error("❌ Unhandled error:", error);
		process.exit(1);
	});
