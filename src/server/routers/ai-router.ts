import { z } from "zod";
import { j, publicProcedure } from "../jstack";

export const aiRouter = j.router({
	generate: publicProcedure
		.input(
			z.object({
				prompt: z.string(),
				system: z.string().optional(),
			}),
		)
		.query(async ({ ctx, c, input }) => {
			const { ai } = ctx;

			const system =
				input.system ||
				"You are a man of few words. You can only respond with 10 words or less.";

			const messages = [
				{
					role: "system",
					content: system,
				},
				{
					role: "user",
					content: input.prompt,
				},
			];

			const value = await ai.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
				messages,
			});

			return c.superjson(value);
		}),
});
