import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { j, privateProcedure } from "../jstack";

// Define queue item types
interface QueueItem {
	id: string;
	name: string;
	priority: number;
	data: Record<string, unknown>;
	status: "pending" | "processing" | "completed" | "failed";
	createdAt: string;
	updatedAt?: string;
	retryCount?: number;
	result?: Record<string, unknown>;
}

export const queueRouter = j.router({
	createQueueItem: privateProcedure
		.input(
			z.object({
				name: z.string(),
				priority: z.number().int().min(1).max(5).default(3),
				data: z.record(z.any()).optional(),
			}),
		)
		.mutation(async ({ ctx, c, input }) => {
			const { name, priority, data } = input;
			const { queue, kv } = ctx;

			// Generate a unique ID
			const id = crypto.randomUUID();

			// Create the queue item
			const queueItem: QueueItem = {
				id,
				name,
				priority,
				data: data || {},
				status: "pending",
				createdAt: new Date().toISOString(),
			};

			// Store metadata in KV
			await kv.put(`queue:${id}`, JSON.stringify(queueItem));
			await kv.put(`queue:status:pending:${id}`, JSON.stringify(queueItem));

			// Send to queue
			await queue.send(id);

			return c.superjson({
				message: "Queue item created",
				queueItem,
			});
		}),

	listQueueItems: privateProcedure
		.input(
			z
				.object({
					status: z
						.enum(["pending", "processing", "completed", "failed", "all"])
						.default("all"),
					limit: z.number().int().min(1).max(100).default(50),
				})
				.optional(),
		)
		.query(async ({ ctx, c, input }) => {
			const { kv } = ctx;
			const { status = "all", limit = 50 } = input || {};

			const queueItems: QueueItem[] = [];

			if (status === "all") {
				// 只获取主记录，避免重复
				const allItems = await kv.list({ prefix: "queue:", limit });

				// 过滤掉状态索引记录
				const mainKeys = allItems.keys.filter((key) => {
					const keyName = key.name;
					return (
						keyName.startsWith("queue:") && !keyName.includes("queue:status:")
					);
				});

				// 获取主记录数据
				for (const key of mainKeys) {
					const item = await kv.get(key.name, "json");
					if (item) queueItems.push(item as QueueItem);
				}
			} else {
				// 获取特定状态的记录
				const statusItems = await kv.list({
					prefix: `queue:status:${status}:`,
					limit,
				});

				for (const key of statusItems.keys) {
					const item = await kv.get(key.name, "json");
					if (item) queueItems.push(item as QueueItem);
				}
			}

			return c.superjson({
				items: queueItems,
			});
		}),

	getQueueItemById: privateProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, c, input }) => {
			const { id } = input;
			const { kv } = ctx;

			const queueItem = (await kv.get(
				`queue:${id}`,
				"json",
			)) as QueueItem | null;
			if (!queueItem) {
				throw new HTTPException(404, {
					message: "Queue item not found",
				});
			}

			return c.superjson(queueItem);
		}),

	updateQueueItemStatus: privateProcedure
		.input(
			z.object({
				id: z.string(),
				status: z.enum(["pending", "processing", "completed", "failed"]),
				result: z.record(z.any()).optional(),
			}),
		)
		.mutation(async ({ ctx, c, input }) => {
			const { id, status, result } = input;
			const { kv } = ctx;

			const queueItem = (await kv.get(
				`queue:${id}`,
				"json",
			)) as QueueItem | null;
			if (!queueItem) {
				throw new HTTPException(404, {
					message: "Queue item not found",
				});
			}

			const updated: QueueItem = {
				...queueItem,
				status,
				...(result ? { result } : {}),
				updatedAt: new Date().toISOString(),
			};

			await kv.put(`queue:${id}`, JSON.stringify(updated));

			// Update status index - delete old status entry and add new one
			await kv.delete(`queue:status:${queueItem.status}:${id}`);
			await kv.put(`queue:status:${status}:${id}`, JSON.stringify(updated));

			return c.superjson({
				message: "Queue item updated",
				queueItem: updated,
			});
		}),

	deleteQueueItem: privateProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, c, input }) => {
			const { id } = input;
			const { kv } = ctx;

			const queueItem = (await kv.get(
				`queue:${id}`,
				"json",
			)) as QueueItem | null;
			if (!queueItem) {
				throw new HTTPException(404, {
					message: "Queue item not found",
				});
			}

			// Delete both the main entry and the status index
			await kv.delete(`queue:${id}`);
			await kv.delete(`queue:status:${queueItem.status}:${id}`);

			return c.superjson({
				message: "Queue item deleted",
			});
		}),

	retryQueueItem: privateProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, c, input }) => {
			const { id } = input;
			const { kv, queue } = ctx;

			const queueItem = (await kv.get(
				`queue:${id}`,
				"json",
			)) as QueueItem | null;
			if (!queueItem) {
				throw new HTTPException(404, {
					message: "Queue item not found",
				});
			}

			// Update the retry count and status
			const updated: QueueItem = {
				...queueItem,
				status: "pending",
				retryCount: (queueItem.retryCount || 0) + 1,
				updatedAt: new Date().toISOString(),
			};

			// Update in KV store
			await kv.put(`queue:${id}`, JSON.stringify(updated));

			// Delete old status index and create new one
			await kv.delete(`queue:status:${queueItem.status}:${id}`);
			await kv.put(`queue:status:pending:${id}`, JSON.stringify(updated));

			// Send back to queue
			await queue.send(id);

			return c.superjson({
				message: "Queue item queued for retry",
				queueItem: updated,
			});
		}),
});
