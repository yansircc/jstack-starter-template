"use client";

import { ClerkProvider } from "@clerk/nextjs";
import {
	QueryCache,
	QueryClient,
	QueryClientProvider,
} from "@tanstack/react-query";
import { HTTPException } from "hono/http-exception";
import { type PropsWithChildren, useState } from "react";
import { Toaster } from "sonner";

export const Providers = ({ children }: PropsWithChildren) => {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				queryCache: new QueryCache({
					onError: (err) => {
						if (err instanceof HTTPException) {
							// global error handling, e.g. toast notification ...
						}
					},
				}),
			}),
	);

	return (
		<ClerkProvider>
			<QueryClientProvider client={queryClient}>
				<Toaster
					className="z-50"
					duration={2000}
					theme="dark"
					richColors
					position="top-center"
				/>
				{children}
			</QueryClientProvider>
		</ClerkProvider>
	);
};
