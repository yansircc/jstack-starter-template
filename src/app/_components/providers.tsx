"use client";

import { ClerkProvider } from "@clerk/nextjs";
import {
	MutationCache,
	QueryCache,
	QueryClient,
	QueryClientProvider,
} from "@tanstack/react-query";
import { HTTPException } from "hono/http-exception";
import { type PropsWithChildren, useState } from "react";
import { Toaster, toast } from "sonner";

export const Providers = ({ children }: PropsWithChildren) => {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						retry: false,
					},
				},
				queryCache: new QueryCache({
					onError: (err) => {
						if (err instanceof HTTPException) {
							toast.error(err.message);
						}
					},
				}),
				mutationCache: new MutationCache({
					onError: (err) => {
						if (err instanceof HTTPException) {
							toast.error(err.message);
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
