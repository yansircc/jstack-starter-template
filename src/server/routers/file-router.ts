import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { j, privateProcedure } from "../jstack";

export const fileRouter = j.router({
	upload: privateProcedure.mutation(async ({ ctx, c }) => {
		const { r2 } = ctx;

		// 使用Hono的parseBody方法处理文件上传
		const body = await c.req.parseBody();
		const file = body.file;

		if (!file || !(file instanceof File)) {
			throw new HTTPException(400, {
				message: "未提供文件或文件无效",
			});
		}

		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		const key = `user/${file.name}`;
		const upload = await r2.put(key, buffer);

		return c.superjson(upload);
	}),

	delete: privateProcedure
		.input(z.object({ key: z.string() }))
		.mutation(async ({ ctx, c, input }) => {
			const { key } = input;
			const { r2 } = ctx;

			await r2.delete(key);

			return c.superjson({
				message: "File deleted",
			});
		}),

	listAll: privateProcedure.query(async ({ ctx, c }) => {
		const { r2 } = ctx;

		const files = await r2.list();

		return c.superjson(files);
	}),

	getById: privateProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, c, input }) => {
			const { id } = input;
			const { r2 } = ctx;

			const file = await r2.get(id);

			return c.superjson(file);
		}),
});
