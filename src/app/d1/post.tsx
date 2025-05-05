"use client";

import { createAuthClient } from "@/lib/client";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

interface Post {
	id: number;
	name: string;
	createdAt: Date;
	updatedAt: Date | null;
}

export const D1Demo = () => {
	const [name, setName] = useState<string>("");
	const [editingPost, setEditingPost] = useState<Post | null>(null);
	const [editName, setEditName] = useState<string>("");

	const queryClient = useQueryClient();
	const { getToken } = useAuth();
	const authClient = createAuthClient(getToken);

	// Get all posts
	const { data: posts, isPending: isLoadingPosts } = useQuery({
		queryKey: ["get-all-posts"],
		queryFn: async () => {
			const res = await authClient.post.getAll.$get();
			return await res.json();
		},
	});

	// Create post
	const { mutate: createPost, isPending: isCreating } = useMutation({
		mutationFn: async ({ name }: { name: string }) => {
			const res = await authClient.post.create.$post({ name });
			return await res.json();
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ["get-all-posts"] });
			setName("");
		},
	});

	// Update post
	const { mutate: updatePost, isPending: isUpdating } = useMutation({
		mutationFn: async ({ id, name }: { id: number; name: string }) => {
			const res = await authClient.post.update.$post({ id, name });
			return await res.json();
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ["get-all-posts"] });
			setEditingPost(null);
			setEditName("");
		},
	});

	// Delete post
	const { mutate: deletePost, isPending: isDeleting } = useMutation({
		mutationFn: async ({ id }: { id: number }) => {
			const res = await authClient.post.delete.$post({ id });
			return await res.json();
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ["get-all-posts"] });
		},
	});

	const startEditing = (post: Post) => {
		setEditingPost(post);
		setEditName(post.name);
	};

	const cancelEditing = () => {
		setEditingPost(null);
		setEditName("");
	};

	const formatDate = (dateString: Date) => {
		return new Date(dateString).toLocaleString();
	};

	return (
		<div className="w-full max-w-3xl backdrop-blur-lg bg-black/15 px-8 py-6 rounded-md text-zinc-100/75 space-y-6">
			{/* Create Post Form */}
			<div className="space-y-4 border-b border-zinc-800 pb-6">
				<h3 className="text-lg font-medium text-zinc-200">Create New Post</h3>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						if (name.trim()) createPost({ name });
					}}
					className="flex flex-col gap-4"
				>
					<input
						type="text"
						placeholder="Enter a post title..."
						value={name}
						onChange={(e) => setName(e.target.value)}
						className="w-full text-base/6 rounded-md bg-black/50 hover:bg-black/75 focus-visible:outline-none ring-2 ring-transparent hover:ring-zinc-800 focus:ring-zinc-800 focus:bg-black/75 transition h-12 px-4 py-2 text-zinc-100"
					/>
					<button
						disabled={isCreating || !name.trim()}
						type="submit"
						className="self-start rounded-md text-base/6 ring-2 ring-offset-2 ring-offset-black focus-visible:outline-none focus-visible:ring-zinc-100 ring-transparent hover:ring-zinc-100 h-10 px-6 py-2 bg-brand-700 text-zinc-800 font-medium bg-gradient-to-tl from-zinc-300 to-zinc-200 transition hover:bg-brand-800 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isCreating ? "Creating..." : "Create Post"}
					</button>
				</form>
			</div>

			{/* Posts List */}
			<div className="space-y-4">
				<h3 className="text-lg font-medium text-zinc-200">Posts List</h3>

				{isLoadingPosts ? (
					<p className="text-[#ececf399] text-base/6">Loading posts...</p>
				) : !posts || posts.length === 0 ? (
					<p className="text-[#ececf399] text-base/6">
						No posts found. Create one above.
					</p>
				) : (
					<ul className="space-y-4">
						{posts.map((post: Post) => (
							<li
								key={post.id}
								className="bg-black/25 rounded-md p-4 hover:bg-black/30 transition"
							>
								{editingPost?.id === post.id ? (
									<div className="space-y-3">
										<input
											type="text"
											value={editName}
											onChange={(e) => setEditName(e.target.value)}
											className="w-full text-base/6 rounded-md bg-black/50 hover:bg-black/75 focus-visible:outline-none ring-2 ring-transparent hover:ring-zinc-800 focus:ring-zinc-800 focus:bg-black/75 transition h-10 px-4 py-2 text-zinc-100"
										/>
										<div className="flex gap-2">
											<button
												type="button"
												onClick={() =>
													updatePost({ id: post.id, name: editName })
												}
												disabled={isUpdating || !editName.trim()}
												className="text-sm px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 rounded text-blue-300 transition"
											>
												{isUpdating ? "Saving..." : "Save"}
											</button>
											<button
												type="button"
												onClick={cancelEditing}
												className="text-sm px-3 py-1 bg-zinc-500/20 hover:bg-zinc-500/30 rounded text-zinc-300 transition"
											>
												Cancel
											</button>
										</div>
									</div>
								) : (
									<div className="space-y-2">
										<div className="flex justify-between">
											<h4 className="text-lg text-zinc-100 font-medium">
												{post.name}
											</h4>
											<div className="flex gap-2">
												<button
													type="button"
													onClick={() => startEditing(post)}
													className="text-sm px-3 py-1 bg-zinc-500/20 hover:bg-zinc-500/30 rounded text-zinc-300 transition"
												>
													Edit
												</button>
												<button
													type="button"
													onClick={() => deletePost({ id: post.id })}
													disabled={isDeleting}
													className="text-sm px-3 py-1 bg-red-500/20 hover:bg-red-500/30 rounded text-red-300 transition"
												>
													{isDeleting ? "Deleting..." : "Delete"}
												</button>
											</div>
										</div>
										<div className="text-xs text-zinc-400 space-y-1">
											<p>ID: {post.id}</p>
											<p>Created: {formatDate(post.createdAt)}</p>
											{post.updatedAt && (
												<p>Updated: {formatDate(post.updatedAt)}</p>
											)}
										</div>
									</div>
								)}
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	);
};
