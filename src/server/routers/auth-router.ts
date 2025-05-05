import { z } from "zod";
import { j, privateProcedure, publicProcedure } from "../jstack";

/**
 * Auth router that demonstrates authentication middleware
 * Contains both public and protected routes
 */
export const authRouter = j.router({
	// Public route to get server info
	getServerInfo: publicProcedure.query(async ({ c }) => {
		return c.superjson({
			serverTime: new Date().toISOString(),
			environment: "cloudflare-worker",
			message: "This is a public endpoint that doesn't require authentication",
		});
	}),

	// Protected route that demonstrates auth middleware
	getUserProfile: privateProcedure.query(async ({ ctx, c }) => {
		const { user } = ctx;

		// This will only execute if the user is authenticated
		// Otherwise, the auth middleware will throw a 401 error
		return c.superjson({
			user,
			message:
				"This data is protected and only available to authenticated users",
			timestamp: new Date().toISOString(),
		});
	}),

	// Test route to check auth status with a parameter
	testAuth: privateProcedure
		.input(
			z
				.object({
					message: z.string().optional(),
				})
				.optional(),
		)
		.mutation(async ({ ctx, c, input }) => {
			const { user } = ctx;
			const message = input?.message || "Authentication test successful";

			return c.superjson({
				success: true,
				message,
				user,
			});
		}),

	// Simulated logout function - in a real app, this would clear auth cookies
	getSecret: privateProcedure.mutation(async ({ c, ctx }) => {
		// In a real implementation, you would do something like:
		const { user } = ctx;

		if (!user) {
			return c.superjson({
				success: false,
				message: "No user found",
			});
		}

		return c.superjson({
			success: true,
			message: `The user is ${user.email}`,
		});
	}),
});
