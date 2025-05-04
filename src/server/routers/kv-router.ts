import { z } from "zod";
import { j, publicProcedure } from "../jstack";

export const kvRouter = j.router({
	// 获取单个KV值
	get: publicProcedure
		.input(z.object({ key: z.string() }).optional())
		.query(async ({ ctx, c, input }) => {
			const { kv } = ctx;
			const key = input?.key || "hello";
			const value = await kv.get(key);
			return c.superjson({
				key,
				value,
				type: typeof value,
			});
		}),

	// 获取KV值并指定返回类型
	getWithType: publicProcedure
		.input(
			z.object({
				key: z.string(),
				type: z.enum(["text", "json", "arrayBuffer", "stream"]).default("text"),
			}),
		)
		.query(async ({ ctx, c, input }) => {
			const { kv } = ctx;
			const { key, type } = input;

			let value: unknown;
			try {
				switch (type) {
					case "json":
						value = await kv.get(key, "json");
						break;
					case "arrayBuffer":
						value = await kv.get(key, "arrayBuffer");
						// 转换为可序列化的格式
						if (value) {
							value = Array.from(new Uint8Array(value as ArrayBuffer));
						}
						break;
					case "stream":
						// 流不能直接返回，获取为文本
						value = await kv.get(key, "text");
						break;
					default:
						value = await kv.get(key, "text");
				}

				return c.superjson({
					key,
					value,
					type,
					success: true,
				});
			} catch (error) {
				return c.superjson({
					key,
					error: error instanceof Error ? error.message : "Unknown error",
					type,
					success: false,
				});
			}
		}),

	// 设置KV值
	set: publicProcedure
		.input(
			z.object({
				key: z.string(),
				value: z.any(),
				expirationTtl: z.number().optional(),
			}),
		)
		.mutation(async ({ ctx, c, input }) => {
			const { kv } = ctx;
			const { key, value, expirationTtl } = input;

			try {
				// 使用JSON以支持复杂数据类型
				const options = expirationTtl ? { expirationTtl } : undefined;
				await kv.put(key, JSON.stringify(value), options);

				return c.superjson({
					key,
					success: true,
					expiresIn: expirationTtl ? `${expirationTtl} seconds` : "never",
				});
			} catch (error) {
				return c.superjson({
					key,
					success: false,
					error: error instanceof Error ? error.message : "Unknown error",
				});
			}
		}),

	// 删除KV值
	delete: publicProcedure
		.input(z.object({ key: z.string() }))
		.mutation(async ({ ctx, c, input }) => {
			const { kv } = ctx;
			const { key } = input;

			try {
				await kv.delete(key);
				return c.superjson({
					key,
					success: true,
				});
			} catch (error) {
				return c.superjson({
					key,
					success: false,
					error: error instanceof Error ? error.message : "Unknown error",
				});
			}
		}),

	// 列出所有KV值（支持前缀过滤）
	list: publicProcedure
		.input(
			z
				.object({
					prefix: z.string().optional(),
					limit: z.number().min(1).max(1000).default(100),
				})
				.optional(),
		)
		.query(async ({ ctx, c, input }) => {
			const { kv } = ctx;
			const { prefix, limit = 100 } = input || {};

			try {
				const options: { prefix?: string; limit: number } = { limit };
				if (prefix) options.prefix = prefix;

				const listResult = await kv.list(options);

				// 获取前10个项目的值
				const keysWithValues = await Promise.all(
					listResult.keys.slice(0, 10).map(async (key) => {
						const value = await kv.get(key.name, "text");
						return {
							key: key.name,
							value,
						};
					}),
				);

				return c.superjson({
					keys: listResult.keys.map((k) => k.name),
					complete: listResult.list_complete,
					count: listResult.keys.length,
					keysWithValues,
					success: true,
				});
			} catch (error) {
				return c.superjson({
					success: false,
					error: error instanceof Error ? error.message : "Unknown error",
				});
			}
		}),

	// 演示：设置带有过期时间的值
	setWithExpiration: publicProcedure
		.input(
			z.object({
				key: z.string(),
				value: z.string(),
				expirationTtl: z.number().min(60).default(300), // 默认5分钟
			}),
		)
		.mutation(async ({ ctx, c, input }) => {
			const { kv } = ctx;
			const { key, value, expirationTtl } = input;

			try {
				await kv.put(key, value, { expirationTtl });

				return c.superjson({
					key,
					value,
					expiresIn: `${expirationTtl} seconds`,
					success: true,
				});
			} catch (error) {
				return c.superjson({
					key,
					success: false,
					error: error instanceof Error ? error.message : "Unknown error",
				});
			}
		}),
});
