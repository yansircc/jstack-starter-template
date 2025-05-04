"use client";

import { client } from "@/lib/client";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

interface SearchResult {
	text: string;
}

export const Search = () => {
	const resultsEndRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const [query, setQuery] = useState("");
	const [result, setResult] = useState<SearchResult | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	// 使用TanStack Query的mutation进行搜索
	const { mutate: performSearch } = useMutation({
		mutationFn: async (searchQuery: string) => {
			setIsLoading(true);

			try {
				// 使用类型安全的client发送搜索请求
				const response = await client.ai.search.$post({
					query: searchQuery,
				});

				if (!response.ok) throw new Error("请求失败");

				// 处理SSE响应
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

					try {
						// 尝试解析JSON (可能会收到部分数据)
						const jsonStartIndex = accumulated.indexOf("{");
						if (jsonStartIndex !== -1) {
							const jsonText = accumulated.slice(jsonStartIndex);
							try {
								const data = JSON.parse(jsonText);
								if (data.text) {
									setResult({ text: data.text });
								}
							} catch {
								// 忽略解析错误，等待更多数据
							}
						}
					} catch (error) {
						console.error("解析搜索结果时出错:", error);
					}
				}

				setIsLoading(false);
				return accumulated;
			} catch (error) {
				console.error("搜索错误:", error);
				setIsLoading(false);
				throw error;
			}
		},
		onSuccess: () => {
			// 搜索完成后聚焦到输入框
			setTimeout(() => {
				inputRef.current?.focus();
			}, 100);
		},
	});

	// 处理提交
	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!query.trim() || isLoading) return;

		setResult(null);
		performSearch(query);
	};

	// 滚动到底部 - 当结果更新时
	useEffect(() => {
		if (resultsEndRef.current) {
			resultsEndRef.current.scrollIntoView({ behavior: "smooth" });
		}
	}, []);

	// 组件挂载时聚焦到输入框
	useEffect(() => {
		inputRef.current?.focus();
	}, []);

	return (
		<div className="w-full max-w-md backdrop-blur-lg bg-black/15 px-8 py-6 rounded-md text-zinc-100/75 space-y-6">
			<h4 className="text-lg font-medium text-zinc-200">文档搜索</h4>

			{/* 搜索表单 */}
			<form onSubmit={handleSubmit} className="space-y-4">
				<label className="flex flex-col gap-2">
					<span className="text-sm">搜索查询</span>
					<input
						ref={inputRef}
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						disabled={isLoading}
						placeholder="输入搜索内容..."
						className="bg-black/30 p-3 rounded-md text-sm text-zinc-200 placeholder:text-zinc-500 resize-none focus:outline-none focus:ring-1 focus:ring-zinc-500"
					/>
				</label>

				<button
					type="submit"
					disabled={isLoading || !query.trim()}
					className={`rounded-md text-base/6 ring-2 ring-offset-2 ring-offset-black focus-visible:outline-none focus-visible:ring-zinc-100 
          h-12 px-10 py-3 text-zinc-800 font-medium transition w-full
          ${
						!query.trim() || isLoading
							? "bg-zinc-600 ring-transparent cursor-not-allowed opacity-50"
							: "bg-gradient-to-tl from-zinc-300 to-zinc-200 ring-transparent hover:ring-zinc-100"
					}`}
				>
					{isLoading ? "搜索中..." : "搜索"}
				</button>
			</form>

			{/* 搜索结果 */}
			<div className="space-y-4 min-h-[300px] max-h-[500px] overflow-y-auto pr-2 border-t border-zinc-700/50 pt-6">
				{isLoading ? (
					<div className="p-3 rounded-md bg-black/40">
						<p className="text-sm font-medium mb-1">搜索中</p>
						<div className="text-sm whitespace-pre-wrap">
							查找相关文档内容...
						</div>
					</div>
				) : result ? (
					<div className="p-3 rounded-md bg-black/40">
						<p className="text-sm font-medium mb-1">搜索结果</p>
						<div className="text-sm whitespace-pre-wrap">{result.text}</div>
					</div>
				) : (
					<div className="text-center text-zinc-400 py-8">
						<p>输入关键词查找相关文档内容</p>
					</div>
				)}
				<div ref={resultsEndRef} />
			</div>
		</div>
	);
};

export default Search;
