"use client";

import { createAuthClient } from "@/lib/client";
import { getBackendUrl } from "@/lib/utils";
import { useAuth } from "@clerk/nextjs";
import type { R2Object } from "@cloudflare/workers-types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HTTPException } from "hono/http-exception";
import { useState } from "react";

interface FileItem {
	key: string;
	size: number;
	uploaded: string;
	etag?: string;
}

export const FileManager = () => {
	const [file, setFile] = useState<File | null>(null);
	const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
	const queryClient = useQueryClient();

	const { getToken } = useAuth();
	const authClient = createAuthClient(getToken);

	// Fetch all files
	const { data: files, isPending: isLoadingFiles } = useQuery({
		queryKey: ["admin-files"],
		queryFn: async () => {
			const res = await authClient.file.listAll.$get();
			const data = await res.json();
			// Convert R2Objects to FileItem array
			return Array.isArray(data?.objects)
				? data.objects.map((obj: R2Object) => ({
						key: obj.key,
						size: obj.size,
						uploaded:
							typeof obj.uploaded === "string"
								? obj.uploaded
								: new Date(obj.uploaded).toISOString(),
						etag: obj.etag,
					}))
				: [];
		},
	});

	// Upload file mutation
	const { mutate: uploadFile, isPending: isUploading } = useMutation({
		mutationFn: async (token: string | null) => {
			if (!file) {
				throw new Error("No file selected");
			}

			// 创建FormData
			const formData = new FormData();
			formData.append("file", file);

			const baseUrl = `${getBackendUrl()}/api`;

			const headers = new Headers();

			if (token) {
				headers.set("Authorization", `Bearer ${token}`);
			}

			// 使用fetch上传文件
			const res = await fetch(`${baseUrl}/file/upload`, {
				method: "POST",
				body: formData,
				credentials: "include",
				headers,
			});

			if (!res.ok) {
				throw new HTTPException(400, {
					message: "上传失败",
				});
			}

			return await res.json();
		},

		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ["admin-files"] });
			setFile(null);
		},
	});

	// Delete file mutation
	const { mutate: deleteFile, isPending: isDeleting } = useMutation({
		mutationFn: async (key: string) => {
			const res = await authClient.file.delete.$post({ key });
			return await res.json();
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ["admin-files"] });
			setSelectedFile(null);
		},
	});

	// Get file by ID query
	const { mutate: viewFileDetails, isPending: isLoadingFileDetails } =
		useMutation({
			mutationFn: async (id: string) => {
				const res = await authClient.file.getById.$get({ id });
				return await res.json();
			},
			onSuccess: (data) => {
				console.log("File details:", data);
				// You could do something with the file details here
			},
		});

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const selectedFile = e.target.files?.[0];
		if (!selectedFile) {
			return;
		}
		setFile(selectedFile);
	};

	return (
		<div className="w-full max-w-md backdrop-blur-lg bg-black/15 px-8 py-6 rounded-md text-zinc-100/75 space-y-6">
			{/* Upload Section */}
			<div className="space-y-4">
				<h4 className="text-lg font-medium text-zinc-200">Upload New File</h4>

				{file && (
					<div className="bg-black/30 p-3 rounded-md">
						<p className="text-sm truncate">{file.name}</p>
						<p className="text-xs text-zinc-400">
							{(file.size / 1024).toFixed(2)} KB - {file.type}
						</p>
					</div>
				)}

				<div className="flex flex-col gap-4">
					<label className="flex flex-col gap-2">
						<span className="text-sm">Select a file to upload</span>
						<input
							type="file"
							onChange={handleFileChange}
							className="block w-full text-sm text-zinc-400
							file:mr-4 file:py-2 file:px-4
							file:rounded-md file:border-0
							file:text-sm file:font-medium
							file:bg-black/50 file:text-zinc-200
							hover:file:bg-black/75 file:cursor-pointer
							focus:outline-none"
						/>
					</label>

					<button
						type="button"
						onClick={() => {
							getToken().then((token) => {
								uploadFile(token);
							});
						}}
						disabled={isUploading || !file}
						className={`rounded-md text-base/6 ring-2 ring-offset-2 ring-offset-black focus-visible:outline-none focus-visible:ring-zinc-100 
							h-12 px-10 py-3 text-zinc-800 font-medium transition
							${
								!file
									? "bg-zinc-600 ring-transparent cursor-not-allowed opacity-50"
									: "bg-gradient-to-tl from-zinc-300 to-zinc-200 ring-transparent hover:ring-zinc-100 hover:bg-brand-800"
							}`}
					>
						{isUploading ? "Uploading..." : "Upload File"}
					</button>
				</div>
			</div>

			{/* Files List Section */}
			<div className="space-y-4 border-t border-zinc-700/50 pt-6">
				<h4 className="text-lg font-medium text-zinc-200">Your Files</h4>

				{isLoadingFiles ? (
					<p className="text-zinc-400 text-sm">Loading files...</p>
				) : files && files.length > 0 ? (
					<div className="space-y-3">
						{files.map((fileItem) => (
							<button
								key={fileItem.key}
								type="button"
								className={`bg-black/30 p-3 rounded-md cursor-pointer transition hover:bg-black/40 border border-transparent w-full text-left ${
									selectedFile?.key === fileItem.key ? "border-zinc-500" : ""
								}`}
								onClick={() => setSelectedFile(fileItem)}
								aria-label={`Select file ${fileItem.key.split("/").pop()}`}
							>
								<div className="flex justify-between">
									<p className="text-sm truncate">
										{fileItem.key.split("/").pop()}
									</p>
									<p className="text-xs text-zinc-400">
										{(fileItem.size / 1024).toFixed(2)} KB
									</p>
								</div>
								<p className="text-xs text-zinc-500">
									{new Date(fileItem.uploaded).toLocaleString()}
								</p>
							</button>
						))}
					</div>
				) : (
					<p className="text-zinc-400 text-sm">No files found.</p>
				)}

				{/* Selected File Actions */}
				{selectedFile && (
					<div className="bg-black/40 p-4 rounded-md space-y-3">
						<h5 className="text-sm font-medium">
							Selected: {selectedFile.key.split("/").pop()}
						</h5>

						<div className="flex gap-3">
							<button
								type="button"
								onClick={() => viewFileDetails(selectedFile.key)}
								disabled={isLoadingFileDetails}
								className="px-3 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 rounded-md transition"
							>
								{isLoadingFileDetails ? "Loading..." : "View Details"}
							</button>

							<button
								type="button"
								onClick={() => deleteFile(selectedFile.key)}
								disabled={isDeleting}
								className="px-3 py-1.5 text-xs bg-red-900/70 hover:bg-red-800/70 rounded-md transition"
							>
								{isDeleting ? "Deleting..." : "Delete File"}
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};
