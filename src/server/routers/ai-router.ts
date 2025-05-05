import { streamText } from "ai";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { j, privateProcedure, publicProcedure } from "../jstack";

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
			const { openai } = ctx;
			const { messages, system } = input;

			try {
				// 创建流式文本响应
				const result = streamText({
					model: openai("gpt-4o-mini"),
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
			} catch (error) {
				console.error(error);
				throw new HTTPException(500, {
					message: "Failed to generate text",
				});
			}
		}),

	search: privateProcedure
		.input(
			z.object({
				query: z.string(),
			}),
		)
		.post(async ({ ctx, c, input }) => {
			const { cloudflareai, openai } = ctx;
			const { query } = input;

			try {
				// 使用 AutoRAG 搜索相关文档
				const searchResult = await cloudflareai
					.autorag("learn-jstack")
					.aiSearch({
						query,
					});

				if (searchResult.data.length === 0) {
					// 没有找到匹配的文档
					return c.json({ text: `没有找到与查询 "${query}" 相关的数据` });
				}

				// 将所有文档片段组合成单个字符串
				const chunks = searchResult.data
					.map((item) => {
						const data = item.content
							.map((content) => {
								return content.text;
							})
							.join("\n\n");

						return `<file name="${item.filename}">${data}</file>`;
					})
					.join("\n\n");

				// 将用户查询和匹配的文档发送给 OpenAI 生成回答
				const result = streamText({
					model: openai("gpt-4o-mini"),
					messages: [
						{
							role: "system",
							content:
								"你是一个有用的助手，你的任务是使用提供的文件来回答用户的问题。",
						},
						{ role: "user", content: chunks },
						{ role: "user", content: query },
					],
				});

				// 返回生成的答案
				return result.toTextStreamResponse({
					headers: {
						"Content-Type": "text/x-unknown",
						"content-encoding": "identity",
						"transfer-encoding": "chunked",
					},
				});
			} catch (error) {
				console.error("搜索或生成回答时出错:", error);
				throw new HTTPException(500, {
					message: "Failed to search or generate response",
				});
			}
		}),
});
