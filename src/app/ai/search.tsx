"use client";

import { createAuthClient } from "@/lib/client";
import { useAuth } from "@clerk/nextjs";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface SearchResult {
	query: string;
	result: string;
	timestamp: number;
}

export const Search = () => {
	const inputRef = useRef<HTMLInputElement>(null);
	const [query, setQuery] = useState("");
	const [result, setResult] = useState<SearchResult | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	const { getToken } = useAuth();
	const authClient = createAuthClient(getToken);

	// 使用TanStack Query的mutation进行搜索
	const { mutate: performSearch } = useMutation({
		mutationFn: async (searchQuery: string) => {
			setIsLoading(true);

			const response = await authClient.ai.search.$post({
				query: searchQuery,
			});

			if (!response.ok) throw new Error("请求失败");

			// 处理响应
			const reader = response.body?.getReader();
			if (!reader) throw new Error("无法读取响应流");

			const decoder = new TextDecoder();
			let accumulated = "";

			// 处理流式响应
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				const text = decoder.decode(value, { stream: true });
				accumulated += text;

				// 更新结果
				setResult({
					query: searchQuery,
					result: accumulated,
					timestamp: Date.now(),
				});
			}

			return accumulated;
		},
		onSuccess: () => {
			// 搜索完成后聚焦到输入框
			setTimeout(() => {
				inputRef.current?.focus();
			}, 100);
		},
		onSettled: () => {
			setIsLoading(false);
		},
	});

	// 处理提交
	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!query.trim() || isLoading) return;

		performSearch(query);
	};

	// 组件挂载时聚焦到输入框
	useEffect(() => {
		inputRef.current?.focus();
	}, []);

	return (
		<div className="w-full max-w-2xl backdrop-blur-lg bg-black/15 px-6 py-5 rounded-md text-zinc-100/75">
			{/* 搜索表单 */}
			<form onSubmit={handleSubmit} className="flex gap-2 mb-6">
				<input
					ref={inputRef}
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					disabled={isLoading}
					placeholder="输入搜索内容..."
					className="flex-1 bg-black/30 p-3 rounded-md text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
				/>
				<button
					type="submit"
					disabled={isLoading || !query.trim()}
					className={`rounded-md px-4 py-2 text-sm font-medium transition
					${
						!query.trim() || isLoading
							? "bg-zinc-600 cursor-not-allowed opacity-50"
							: "bg-zinc-300 text-zinc-800 hover:bg-zinc-200"
					}`}
				>
					{isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "搜索"}
				</button>
			</form>

			{/* 搜索结果 */}
			{isLoading || result ? (
				<div className="bg-black/20 rounded-md p-4">
					{result?.query && (
						<div className="text-xs text-zinc-400 mb-3">
							搜索: {result.query}
						</div>
					)}
					<div className="text-sm whitespace-pre-wrap min-h-[200px]">
						{result?.result || "搜索中..."}
					</div>
				</div>
			) : (
				<div className="text-center text-zinc-400 py-20">
					<p>输入关键词查找相关文档内容</p>
				</div>
			)}
		</div>
	);
};

export default Search;
