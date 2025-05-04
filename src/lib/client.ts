import type { AppRouter } from "@/server";
import { createClient } from "jstack";
import { getBackendUrl } from "./utils";

/**
 * Your type-safe API client
 * @see https://jstack.app/docs/backend/api-client
 */

export const client = createClient<AppRouter>({
	baseUrl: getBackendUrl(),
});
