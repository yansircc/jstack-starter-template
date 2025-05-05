import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * Checks if code is running in a worker environment and returns appropriate backend URL
 */
export function getBackendUrl(): string {
	if (process.env.NODE_ENV === "production") {
		return "https://learn-jstack.yansir.workers.dev";
	}
	return "http://localhost:8080";
}
