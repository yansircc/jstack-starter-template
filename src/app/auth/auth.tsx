"use client";

import { createAuthClient } from "@/lib/client";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

interface ServerInfo {
	serverTime: string;
	environment: string;
	message: string;
}

export const AuthDemo = () => {
	const queryClient = useQueryClient();
	const [message, setMessage] = useState<string>("");

	const { getToken } = useAuth();
	const authClient = createAuthClient(getToken);

	// Fetch public server info (no auth required)
	const { data: serverInfo } = useQuery<ServerInfo>({
		queryKey: ["server-info"],
		queryFn: async () => {
			try {
				const res = await authClient.auth.getServerInfo.$get();
				if (!res.ok) {
					throw new Error("Failed to fetch server info");
				}
				return await res.json();
			} catch (err) {
				console.error("Error fetching server info:", err);
				return {
					serverTime: new Date().toISOString(),
					environment: "unknown",
					message: "Error fetching server info",
				};
			}
		},
	});

	// Fetch protected user profile (auth required)
	const { data: userData, isPending: isLoadingUser } = useQuery({
		queryKey: ["auth-user-profile"],
		queryFn: async () => {
			const res = await authClient.auth.getUserProfile.$get();
			return await res.json();
		},
	});

	// Test auth mutation
	const { mutate: testAuth, isPending: isTesting } = useMutation({
		mutationFn: async () => {
			const res = await authClient.auth.testAuth.$post({
				message: message || "Authentication test successful",
			});
			return await res.json();
		},
		onSuccess: (data) => {
			toast.success(
				<div>
					<p className="text-sm text-zinc-200">
						Authentication test successful
					</p>
					<p className="text-xs text-zinc-400">{data.message}</p>
				</div>,
			);
			if (data?.message) {
				setMessage(data.message);
			}
			queryClient.invalidateQueries({ queryKey: ["auth-user-profile"] });
		},
	});

	// get secret handler
	const { mutate: getSecret, isPending: isGettingSecret } = useMutation({
		mutationFn: async () => {
			const res = await authClient.auth.getSecret.$post();
			return await res.json();
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: ["auth-user-profile"] });
			toast.success(
				<div>
					<p className="text-sm text-zinc-200">Get secret successful</p>
					<p className="text-xs text-zinc-400">{data.message}</p>
				</div>,
			);
		},
	});

	return (
		<div className="w-full max-w-md backdrop-blur-lg bg-black/15 px-8 py-6 rounded-md text-zinc-100/75 space-y-6">
			{/* Server Info Section (Public) */}
			<div className="space-y-2">
				<h2 className="text-lg font-medium text-zinc-200">
					Public Server Info
				</h2>
				<div className="bg-black/30 p-3 rounded-md">
					<p className="text-sm text-zinc-300">
						Server Time:{" "}
						{serverInfo?.serverTime
							? new Date(serverInfo.serverTime).toLocaleString()
							: "Unknown"}
					</p>
					<p className="text-sm text-zinc-300">
						Environment: {serverInfo?.environment || "Unknown"}
					</p>
					<p className="text-xs text-zinc-400 mt-2 italic">
						{serverInfo?.message || "Public data - No authentication required"}
					</p>
				</div>
			</div>

			{/* Authentication Status */}
			<div className="space-y-2 border-t border-zinc-700/50 pt-4">
				<h2 className="text-lg font-medium text-zinc-200">
					Authentication Status
				</h2>

				{isLoadingUser ? (
					<p className="text-sm text-zinc-400">Checking authentication...</p>
				) : userData?.user ? (
					<div className="bg-black/30 p-4 rounded-md">
						<div className="flex items-center gap-3 mb-2">
							{userData.user.avatar && (
								<img
									src={userData.user.avatar}
									alt="User avatar"
									className="w-10 h-10 rounded-full"
								/>
							)}
							<div>
								<p className="text-zinc-200 font-medium">
									{userData.user.name}
								</p>
								<p className="text-xs text-zinc-400">{userData.user.email}</p>
							</div>
						</div>
						<div className="grid grid-cols-2 gap-2 text-xs mt-3">
							<div className="bg-zinc-800/50 p-2 rounded">
								<span className="text-zinc-400">Role:</span>
								<span className="ml-1 text-zinc-200">{userData.user.role}</span>
							</div>
							<div className="bg-zinc-800/50 p-2 rounded">
								<span className="text-zinc-400">ID:</span>
								<span className="ml-1 text-zinc-200 text-xs truncate">
									{userData.user.id.slice(0, 8)}...
								</span>
							</div>
						</div>
						<p className="text-xs text-zinc-400 mt-3 italic">
							{userData.message}
						</p>
					</div>
				) : (
					<div className="bg-red-900/20 border border-red-800/30 p-3 rounded-md">
						<p className="text-sm text-red-200">Not authenticated</p>
					</div>
				)}
			</div>

			{/* Actions */}
			<div className="space-y-3 pt-2">
				<h2 className="text-lg font-medium text-zinc-200">Actions</h2>

				<div className="space-y-3">
					<div>
						<label
							htmlFor="message"
							className="block text-sm text-zinc-400 mb-1"
						>
							Custom Message
						</label>
						<input
							type="text"
							id="message"
							value={message}
							onChange={(e) => setMessage(e.target.value)}
							placeholder="Enter a test message"
							className="w-full px-3 py-2 bg-black/30 rounded-md text-sm text-zinc-200 
									   border border-zinc-700 focus:outline-none focus:border-zinc-500"
						/>
					</div>

					<div className="flex flex-col gap-3">
						<button
							type="button"
							onClick={() => testAuth()}
							disabled={isTesting}
							className="flex items-center justify-center px-4 py-2 bg-zinc-800 hover:bg-zinc-700 
									   rounded-md transition text-sm font-medium"
						>
							{isTesting ? "Testing..." : "Test Authentication"}
						</button>

						{userData?.user && (
							<button
								type="button"
								onClick={() => getSecret()}
								disabled={isGettingSecret}
								className="flex items-center justify-center px-4 py-2 bg-red-900/70 hover:bg-red-800/70 
										   rounded-md transition text-sm font-medium"
							>
								{isGettingSecret ? "Getting secret..." : "Get Secret"}
							</button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};
