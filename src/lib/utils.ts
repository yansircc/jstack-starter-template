import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * Checks if code is running in a worker environment and returns appropriate backend URL
 */
export function getBackendUrl(): string {
	// More reliable worker environment detection
	const isWorkerEnv =
		typeof self !== "undefined" &&
		typeof window === "undefined" &&
		typeof fetch === "function";

	return isWorkerEnv
		? "https://learn-jstack.yansir.workers.dev/api"
		: "http://localhost:8080/api";
}
