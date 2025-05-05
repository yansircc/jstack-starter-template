"use client";

import { client } from "@/lib/client";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type MessageRole = "user" | "assistant";

interface Message {
	role: MessageRole;
	content: string;
	id: string;
}

// 定义AI助手的系统提示
const SYSTEM_PROMPT = "你是一个有用、礼貌、友好的AI助手。回答简洁，内容准确。";

export const Chat = () => {
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const [messages, setMessages] = useState<Message[]>([]);
	const [input, setInput] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	// 使用TanStack Query的mutation进行聊天
	const { mutate: sendMessage } = useMutation({
		mutationFn: async (content: string) => {
			// 添加用户消息
			const newUserMessage: Message = {
				role: "user",
				content,
				id: Date.now().toString(),
			};

			// 更新消息列表，添加用户消息和空的AI消息
			const aiMessageId = (Date.now() + 1).toString();
			setMessages((prev) => [
				...prev,
				newUserMessage,
				{ role: "assistant", content: "", id: aiMessageId },
			]);

			setIsLoading(true);

			// 准备发送的消息数组
			const messagesToSend = [...messages, newUserMessage].map((msg) => ({
				role: msg.role,
				content: msg.content,
			}));

			// 使用类型安全的client获取响应
			const response = await client.ai.generate.$post({
				messages: messagesToSend,
				system: SYSTEM_PROMPT, // 添加系统提示
			});

			if (!response.ok) {
				toast.error("请求失败");
			}

			// 使用ReadableStream API处理流式响应
			const reader = response.body?.getReader();
			if (!reader) {
				toast.error("无法读取响应流");
				return;
			}

			const decoder = new TextDecoder();
			let accumulated = "";

			// 处理流式响应
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				const text = decoder.decode(value, { stream: true });
				accumulated += text;

				// 更新AI消息内容
				setMessages((prev) =>
					prev.map((msg) =>
						msg.id === aiMessageId ? { ...msg, content: accumulated } : msg,
					),
				);
			}

			return accumulated;
		},
		onSuccess: () => {
			// AI回复完成后聚焦到输入框
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
		if (!input.trim() || isLoading) return;

		sendMessage(input);
		setInput("");
	};

	// 滚动到底部
	useEffect(() => {
		if (messagesEndRef.current) {
			messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
		}
	});

	// 组件挂载时聚焦到输入框
	useEffect(() => {
		inputRef.current?.focus();
	}, []);

	return (
		<div className="w-full max-w-md backdrop-blur-lg bg-black/15 px-8 py-6 rounded-md text-zinc-100/75 space-y-6">
			<h4 className="text-lg font-medium text-zinc-200">AI 聊天</h4>

			{/* 消息列表 */}
			<div className="space-y-4 min-h-[300px] max-h-[500px] overflow-y-auto pr-2">
				{messages.length > 0 ? (
					messages.map((message) => (
						<div
							key={message.id}
							className={`p-3 rounded-md ${
								message.role === "user"
									? "bg-zinc-800/60 ml-8"
									: "bg-black/40 mr-8"
							}`}
						>
							<p className="text-sm font-medium mb-1">
								{message.role === "user" ? "你" : "AI"}
							</p>
							<div className="text-sm whitespace-pre-wrap">
								{message.content ||
									(message.role === "assistant" && isLoading
										? "思考中..."
										: "")}
							</div>
						</div>
					))
				) : (
					<div className="text-center text-zinc-400 py-8">
						<p>暂无消息。开始一个对话吧！</p>
					</div>
				)}
				<div ref={messagesEndRef} />
			</div>

			{/* 输入表单 */}
			<form
				onSubmit={handleSubmit}
				className="space-y-4 border-t border-zinc-700/50 pt-6"
			>
				<label className="flex flex-col gap-2">
					<span className="text-sm">你的消息</span>
					<input
						ref={inputRef}
						value={input}
						onChange={(e) => setInput(e.target.value)}
						disabled={isLoading}
						placeholder="输入消息..."
						className="bg-black/30 p-3 rounded-md text-sm text-zinc-200 placeholder:text-zinc-500 resize-none focus:outline-none focus:ring-1 focus:ring-zinc-500"
					/>
				</label>

				<button
					type="submit"
					disabled={isLoading || !input.trim()}
					className={`rounded-md text-base/6 ring-2 ring-offset-2 ring-offset-black focus-visible:outline-none focus-visible:ring-zinc-100 
            h-12 px-10 py-3 text-zinc-800 font-medium transition w-full
            ${
							!input.trim() || isLoading
								? "bg-zinc-600 ring-transparent cursor-not-allowed opacity-50"
								: "bg-gradient-to-tl from-zinc-300 to-zinc-200 ring-transparent hover:ring-zinc-100"
						}`}
				>
					{isLoading ? "生成中..." : "发送消息"}
				</button>
			</form>
		</div>
	);
};

export default Chat;
