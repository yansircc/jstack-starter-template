import { posts } from "@/server/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { j, publicProcedure } from "../jstack";

export const postRouter = j.router({
	getAll: publicProcedure.query(async ({ c, ctx }) => {
		const { db } = ctx;

		const allPosts = await db
			.select()
			.from(posts)
			.orderBy(desc(posts.createdAt));

		return c.superjson(allPosts);
	}),

	recent: publicProcedure.query(async ({ c, ctx }) => {
		const { db } = ctx;

		const [recentPost] = await db
			.select()
			.from(posts)
			.orderBy(desc(posts.createdAt))
			.limit(1);

		// throw new Error("test");
		return c.superjson(recentPost ?? null);
	}),

	getById: publicProcedure
		.input(z.object({ id: z.number() }))
		.query(async ({ c, ctx, input }) => {
			const { db } = ctx;
			const { id } = input;

			const [post] = await db.select().from(posts).where(eq(posts.id, id));

			return c.superjson(post ?? null);
		}),

	create: publicProcedure
		.input(z.object({ name: z.string().min(1) }))
		.mutation(async ({ ctx, c, input }) => {
			const { name } = input;
			const { db } = ctx;

			const post = await db.insert(posts).values({ name });

			return c.superjson(post);
		}),

	update: publicProcedure
		.input(z.object({ id: z.number(), name: z.string().min(1) }))
		.mutation(async ({ ctx, c, input }) => {
			const { id, name } = input;
			const { db } = ctx;

			await db
				.update(posts)
				.set({ name, updatedAt: new Date() })
				.where(eq(posts.id, id));

			const [updated] = await db.select().from(posts).where(eq(posts.id, id));

			return c.superjson(updated);
		}),

	delete: publicProcedure
		.input(z.object({ id: z.number() }))
		.mutation(async ({ ctx, c, input }) => {
			const { id } = input;
			const { db } = ctx;

			await db.delete(posts).where(eq(posts.id, id));

			return c.superjson({ success: true, id });
		}),
});
