"use client";

import { createAuthClient } from "@/lib/client";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

interface QueueItem {
	id: string;
	name: string;
	priority: number;
	data: Record<string, unknown>;
	status: "pending" | "processing" | "completed" | "failed";
	createdAt: string;
	updatedAt?: string;
	retryCount?: number;
	result?: Record<string, unknown>;
}

export const QueueManager = () => {
	const [newTaskName, setNewTaskName] = useState("");
	const [taskPriority, setTaskPriority] = useState(3);
	const [taskData, setTaskData] = useState("{}");
	const [selectedItem, setSelectedItem] = useState<QueueItem | null>(null);
	const [statusFilter, setStatusFilter] = useState<
		"all" | "pending" | "processing" | "completed" | "failed"
	>("all");
	const [autoRefresh, setAutoRefresh] = useState(false);
	const queryClient = useQueryClient();
	const { getToken } = useAuth();

	const authClient = createAuthClient(getToken);

	// Fetch all queue items
	const {
		data: queueItems,
		isPending: isLoadingItems,
		refetch,
	} = useQuery({
		queryKey: ["queue-items", statusFilter],
		queryFn: async () => {
			const res = await authClient.queue.listQueueItems.$get({
				status: statusFilter,
				limit: 50,
			});
			const data = await res.json();
			return data.items as QueueItem[];
		},
		refetchInterval: autoRefresh ? 5000 : false, // Auto-refresh based on user preference
	});

	// Create queue item mutation
	const { mutate: createQueueItem, isPending: isCreating } = useMutation({
		mutationFn: async () => {
			// Parse task data as JSON
			const parsedData = JSON.parse(taskData);

			const res = await authClient.queue.createQueueItem.$post({
				name: newTaskName,
				priority: taskPriority,
				data: parsedData,
			});

			return await res.json();
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ["queue-items"] });
			setNewTaskName("");
			setTaskPriority(3);
			setTaskData("{}");
		},
	});

	// Update queue item status mutation
	const { mutate: updateQueueItemStatus, isPending: isUpdating } = useMutation({
		mutationFn: async ({
			id,
			status,
		}: {
			id: string;
			status: "pending" | "processing" | "completed" | "failed";
		}) => {
			const res = await authClient.queue.updateQueueItemStatus.$post({
				id,
				status,
			});
			return await res.json();
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ["queue-items"] });
			setSelectedItem(null);
		},
	});

	// Retry queue item mutation
	const { mutate: retryQueueItem, isPending: isRetrying } = useMutation({
		mutationFn: async (id: string) => {
			const res = await authClient.queue.retryQueueItem.$post({ id });
			return await res.json();
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ["queue-items"] });
			setSelectedItem(null);
		},
	});

	// Delete queue item mutation
	const { mutate: deleteQueueItem, isPending: isDeleting } = useMutation({
		mutationFn: async (id: string) => {
			const res = await authClient.queue.deleteQueueItem.$post({ id });
			return await res.json();
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ["queue-items"] });
			setSelectedItem(null);
		},
	});

	// Format date for display
	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleString();
	};

	// Get color based on status
	const getStatusColor = (status: string) => {
		switch (status) {
			case "pending":
				return "bg-yellow-500/20 text-yellow-300";
			case "processing":
				return "bg-blue-500/20 text-blue-300";
			case "completed":
				return "bg-green-500/20 text-green-300";
			case "failed":
				return "bg-red-500/20 text-red-300";
			default:
				return "bg-gray-500/20 text-gray-300";
		}
	};

	return (
		<div className="w-full max-w-3xl backdrop-blur-lg bg-black/15 px-8 py-6 rounded-md text-zinc-100/75 space-y-6">
			<h2 className="text-2xl font-medium text-zinc-100">Queue Manager</h2>

			{/* Create Task Section */}
			<div className="space-y-4">
				<h3 className="text-lg font-medium text-zinc-200">Create New Task</h3>

				<div className="flex flex-col gap-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<label htmlFor="taskName" className="block text-sm">
								Task Name
							</label>
							<input
								id="taskName"
								type="text"
								value={newTaskName}
								onChange={(e) => setNewTaskName(e.target.value)}
								className="w-full px-3 py-2 bg-black/30 rounded-md text-zinc-100 border border-zinc-700"
								placeholder="Enter task name"
							/>
						</div>

						<div className="space-y-2">
							<label htmlFor="priority" className="block text-sm">
								Priority (1-5)
							</label>
							<select
								id="priority"
								value={taskPriority}
								onChange={(e) => setTaskPriority(Number(e.target.value))}
								className="w-full px-3 py-2 bg-black/30 rounded-md text-zinc-100 border border-zinc-700"
							>
								<option value={1}>1 - Lowest</option>
								<option value={2}>2 - Low</option>
								<option value={3}>3 - Medium</option>
								<option value={4}>4 - High</option>
								<option value={5}>5 - Highest</option>
							</select>
						</div>
					</div>

					<div className="space-y-2">
						<label htmlFor="taskData" className="block text-sm">
							Task Data (JSON)
						</label>
						<textarea
							id="taskData"
							value={taskData}
							onChange={(e) => setTaskData(e.target.value)}
							className="w-full h-24 px-3 py-2 bg-black/30 rounded-md text-zinc-100 border border-zinc-700 font-mono text-sm"
							placeholder="{}"
						/>
					</div>

					<button
						type="button"
						onClick={() => createQueueItem()}
						disabled={isCreating || !newTaskName}
						className={`rounded-md text-base/6 ring-2 ring-offset-2 ring-offset-black focus-visible:outline-none focus-visible:ring-zinc-100 
              h-12 px-10 py-3 text-zinc-800 font-medium transition
              ${
								!newTaskName
									? "bg-zinc-600 ring-transparent cursor-not-allowed opacity-50"
									: "bg-gradient-to-tl from-zinc-300 to-zinc-200 ring-transparent hover:ring-zinc-100 hover:bg-brand-800"
							}`}
					>
						{isCreating ? "Creating..." : "Create Task"}
					</button>
				</div>
			</div>

			{/* Status Filter */}
			<div className="border-t border-zinc-700/50 pt-4">
				<div className="flex justify-between items-center mb-3">
					<h3 className="text-lg font-medium text-zinc-200">Queue Items</h3>

					<div className="flex items-center gap-4">
						<div className="flex items-center gap-2">
							<input
								id="autoRefresh"
								type="checkbox"
								checked={autoRefresh}
								onChange={() => setAutoRefresh(!autoRefresh)}
								className="w-4 h-4 rounded bg-black/30 border-zinc-600"
							/>
							<label htmlFor="autoRefresh" className="text-sm">
								自动刷新 (5秒)
							</label>
						</div>

						<button
							type="button"
							onClick={() => refetch()}
							className="px-3 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 rounded-md"
						>
							手动刷新
						</button>
					</div>
				</div>

				<div className="flex space-x-2 mb-4">
					<button
						type="button"
						onClick={() => setStatusFilter("all")}
						className={`px-3 py-1 rounded-md text-sm ${
							statusFilter === "all"
								? "bg-zinc-100 text-zinc-900"
								: "bg-black/30 text-zinc-300"
						}`}
					>
						All
					</button>
					<button
						type="button"
						onClick={() => setStatusFilter("pending")}
						className={`px-3 py-1 rounded-md text-sm ${
							statusFilter === "pending"
								? "bg-yellow-400 text-yellow-900"
								: "bg-yellow-500/20 text-yellow-300"
						}`}
					>
						Pending
					</button>
					<button
						type="button"
						onClick={() => setStatusFilter("processing")}
						className={`px-3 py-1 rounded-md text-sm ${
							statusFilter === "processing"
								? "bg-blue-400 text-blue-900"
								: "bg-blue-500/20 text-blue-300"
						}`}
					>
						Processing
					</button>
					<button
						type="button"
						onClick={() => setStatusFilter("completed")}
						className={`px-3 py-1 rounded-md text-sm ${
							statusFilter === "completed"
								? "bg-green-400 text-green-900"
								: "bg-green-500/20 text-green-300"
						}`}
					>
						Completed
					</button>
					<button
						type="button"
						onClick={() => setStatusFilter("failed")}
						className={`px-3 py-1 rounded-md text-sm ${
							statusFilter === "failed"
								? "bg-red-400 text-red-900"
								: "bg-red-500/20 text-red-300"
						}`}
					>
						Failed
					</button>
				</div>

				{/* Items List */}
				{isLoadingItems ? (
					<p className="text-zinc-400 text-sm">Loading queue items...</p>
				) : queueItems && queueItems.length > 0 ? (
					<div className="space-y-3">
						{queueItems.map((item) => (
							<button
								key={item.id}
								type="button"
								className={`bg-black/30 p-3 rounded-md cursor-pointer transition hover:bg-black/40 border border-transparent w-full text-left ${
									selectedItem?.id === item.id ? "border-zinc-500" : ""
								}`}
								onClick={() => setSelectedItem(item)}
							>
								<div className="flex justify-between items-center">
									<div>
										<span className="text-sm font-medium">{item.name}</span>
										<span
											className={`ml-2 text-xs px-2 py-0.5 rounded-full ${getStatusColor(item.status)}`}
										>
											{item.status}
										</span>
										{item.retryCount && item.retryCount > 0 ? (
											<span className="ml-2 text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">
												Retry: {item.retryCount}
											</span>
										) : null}
									</div>
									<span className="text-xs text-zinc-400">
										Priority: {item.priority}
									</span>
								</div>
								<p className="text-xs text-zinc-500 mt-1">
									Created: {formatDate(item.createdAt)}
									{item.updatedAt
										? ` · Updated: ${formatDate(item.updatedAt)}`
										: ""}
								</p>
							</button>
						))}
					</div>
				) : (
					<p className="text-zinc-400 text-sm">No queue items found.</p>
				)}

				{/* Selected Item Details */}
				{selectedItem && (
					<div className="mt-4 bg-black/40 p-4 rounded-md space-y-3">
						<div className="flex justify-between items-center">
							<h4 className="text-sm font-medium">
								Selected: {selectedItem.name}
							</h4>
							<span
								className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(selectedItem.status)}`}
							>
								{selectedItem.status}
							</span>
						</div>

						<div className="space-y-2">
							<h5 className="text-xs font-medium text-zinc-400">Task Data:</h5>
							<pre className="text-xs bg-black/30 p-2 rounded-md overflow-x-auto max-h-32 overflow-y-auto">
								{JSON.stringify(selectedItem.data, null, 2)}
							</pre>

							{selectedItem.result && (
								<>
									<h5 className="text-xs font-medium text-zinc-400">Result:</h5>
									<pre className="text-xs bg-black/30 p-2 rounded-md overflow-x-auto max-h-32 overflow-y-auto">
										{JSON.stringify(selectedItem.result, null, 2)}
									</pre>
								</>
							)}
						</div>

						<div className="flex flex-wrap gap-2">
							{selectedItem.status !== "processing" &&
								selectedItem.status !== "completed" && (
									<button
										type="button"
										onClick={() =>
											updateQueueItemStatus({
												id: selectedItem.id,
												status: "processing",
											})
										}
										disabled={isUpdating}
										className="px-3 py-1.5 text-xs bg-blue-900/70 hover:bg-blue-800/70 rounded-md transition"
									>
										{isUpdating ? "Updating..." : "Mark Processing"}
									</button>
								)}

							{selectedItem.status !== "completed" && (
								<button
									type="button"
									onClick={() =>
										updateQueueItemStatus({
											id: selectedItem.id,
											status: "completed",
										})
									}
									disabled={isUpdating}
									className="px-3 py-1.5 text-xs bg-green-900/70 hover:bg-green-800/70 rounded-md transition"
								>
									{isUpdating ? "Updating..." : "Mark Completed"}
								</button>
							)}

							{selectedItem.status !== "failed" && (
								<button
									type="button"
									onClick={() =>
										updateQueueItemStatus({
											id: selectedItem.id,
											status: "failed",
										})
									}
									disabled={isUpdating}
									className="px-3 py-1.5 text-xs bg-red-900/70 hover:bg-red-800/70 rounded-md transition"
								>
									{isUpdating ? "Updating..." : "Mark Failed"}
								</button>
							)}

							{selectedItem.status === "failed" && (
								<button
									type="button"
									onClick={() => retryQueueItem(selectedItem.id)}
									disabled={isRetrying}
									className="px-3 py-1.5 text-xs bg-purple-900/70 hover:bg-purple-800/70 rounded-md transition"
								>
									{isRetrying ? "Retrying..." : "Retry Task"}
								</button>
							)}

							<button
								type="button"
								onClick={() => deleteQueueItem(selectedItem.id)}
								disabled={isDeleting}
								className="px-3 py-1.5 text-xs bg-red-900/70 hover:bg-red-800/70 rounded-md transition ml-auto"
							>
								{isDeleting ? "Deleting..." : "Delete Task"}
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};
