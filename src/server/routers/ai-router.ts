import { streamText } from "ai";
import { z } from "zod";
import { j, publicProcedure } from "../jstack";

export const aiRouter = j.router({
	generate: publicProcedure
		.input(
			z.object({
				messages: z.array(
					z.object({
						role: z.enum(["user", "assistant"]),
						content: z.string(),
					}),
				),
				// 可选系统提示
				system: z.string().optional(),
			}),
		)
		.post(async ({ ctx, c, input }) => {
			const { ai } = ctx;
			const { messages, system } = input;

			// 使用Cloudflare AI
			const model = ai("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {});

			// 创建流式文本响应
			const result = streamText({
				model,
				messages,
				...(system && { system }), // 如果有系统提示，添加到参数中
			});

			// 返回文本流响应
			return result.toTextStreamResponse({
				headers: {
					"Content-Type": "text/x-unknown",
					"content-encoding": "identity",
					"transfer-encoding": "chunked",
				},
			});
		}),
});
