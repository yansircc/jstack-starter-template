import { cors } from "hono/cors";
import { dynamic } from "jstack";
import { j } from "./jstack";

/**
 * This is your base API.
 * Here, you can handle errors, not-found responses, cors and more.
 *
 * @see https://jstack.app/docs/backend/app-router
 */
const api = j
	.router()
	.basePath("/api")
	.use(
		cors({
			origin: ["http://localhost:3000", process.env.FRONTEND_URL || ""],
			allowHeaders: [
				"x-is-superjson",
				"Authorization",
				"Content-Type",
				"content-type",
			],
			exposeHeaders: ["x-is-superjson"],
			credentials: true,
		}),
	)
	.onError(j.defaults.errorHandler);

/**
 * This is the main router for your server.
 * All routers in /server/routers should be added here manually.
 */
const appRouter = j.mergeRouters(api, {
	post: dynamic(() => import("./routers/post-router")),
	file: dynamic(() => import("./routers/file-router")),
	kv: dynamic(() => import("./routers/kv-router")),
	ai: dynamic(() => import("./routers/ai-router")),
	queue: dynamic(() => import("./routers/queue-router")),
	auth: dynamic(() => import("./routers/auth-router")),
});

export type AppRouter = typeof appRouter;

export default appRouter;
