"use client";

import { client } from "@/lib/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type {
	KVDeleteResponse,
	KVGetResponse,
	KVListResponse,
	KVSetResponse,
	KVSetWithExpirationResponse,
	KVType,
} from "./types";

export const KV = () => {
	const [key, setKey] = useState<string>("hello");
	const [valueInput, setValueInput] = useState<string>("");
	const [selectedType, setSelectedType] = useState<KVType>("text");
	const [expirationTtl, setExpirationTtl] = useState<number>(300);
	const [prefix, setPrefix] = useState<string>("");
	const [successMessage, setSuccessMessage] = useState<string>("");
	const [errorMessage, setErrorMessage] = useState<string>("");
	const queryClient = useQueryClient();

	// 获取单个KV值
	const { data: keyData, isLoading: isKeyLoading } = useQuery<KVGetResponse>({
		queryKey: ["kv", "get", key],
		queryFn: async () => {
			if (!key) return null as unknown as KVGetResponse;
			const res = await client.kv.get.$get({ key });
			return await res.json();
		},
		enabled: !!key,
	});

	// 获取所有KV值
	const { data: listData, isLoading: isListLoading } = useQuery<KVListResponse>(
		{
			queryKey: ["kv", "list", prefix],
			queryFn: async () => {
				const res = await client.kv.list.$get({
					prefix: prefix || undefined,
					limit: 100,
				});
				return await res.json();
			},
		},
	);

	// 设置KV值
	const { mutate: setValue, isPending: isSettingValue } = useMutation<
		KVSetResponse,
		Error,
		{ key: string; value: unknown; expirationTtl?: number }
	>({
		mutationFn: async ({ key, value, expirationTtl }) => {
			// 尝试将值解析为JSON
			let parsedValue: unknown;
			try {
				parsedValue = JSON.parse(value as string);
			} catch {
				// 如果解析失败，使用原始字符串
				parsedValue = value;
			}

			const res = await client.kv.set.$post({
				key,
				value: parsedValue,
				expirationTtl,
			});
			return await res.json();
		},
		onSuccess: (data) => {
			if (data.success) {
				setSuccessMessage(
					`成功设置键 "${data.key}"${data.expiresIn ? `，将在 ${data.expiresIn} 后过期` : ""}`,
				);
				setErrorMessage("");
				queryClient.invalidateQueries({ queryKey: ["kv"] });
				setValueInput("");
			} else if (data.error) {
				setErrorMessage(`设置失败: ${data.error}`);
				setSuccessMessage("");
			}
		},
	});

	// 删除KV值
	const { mutate: deleteKey, isPending: isDeletingKey } = useMutation<
		KVDeleteResponse,
		Error,
		string
	>({
		mutationFn: async (keyToDelete) => {
			const res = await client.kv.delete.$post({ key: keyToDelete });
			return await res.json();
		},
		onSuccess: (data) => {
			if (data.success) {
				setSuccessMessage(`成功删除键 "${data.key}"`);
				setErrorMessage("");
				queryClient.invalidateQueries({ queryKey: ["kv"] });
			} else if (data.error) {
				setErrorMessage(`删除失败: ${data.error}`);
				setSuccessMessage("");
			}
		},
	});

	// 设置带过期时间的值
	const { mutate: setWithExpiration, isPending: isSettingWithExpiration } =
		useMutation<
			KVSetWithExpirationResponse,
			Error,
			{ key: string; value: string; expirationTtl: number }
		>({
			mutationFn: async ({ key, value, expirationTtl }) => {
				const res = await client.kv.setWithExpiration.$post({
					key,
					value,
					expirationTtl,
				});
				return await res.json();
			},
			onSuccess: (data) => {
				if (data.success) {
					setSuccessMessage(
						`成功设置键 "${data.key}"${data.value ? ` 为 "${data.value}"` : ""}${data.expiresIn ? `，将在 ${data.expiresIn} 后过期` : ""}`,
					);
					setErrorMessage("");
					queryClient.invalidateQueries({ queryKey: ["kv"] });
					setValueInput("");
				} else if (data.error) {
					setErrorMessage(`设置失败: ${data.error}`);
					setSuccessMessage("");
				}
			},
		});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!key) {
			setErrorMessage("请输入键名");
			return;
		}
		if (!valueInput) {
			setErrorMessage("请输入值");
			return;
		}

		setValue({
			key,
			value: valueInput,
			expirationTtl: expirationTtl > 0 ? expirationTtl : undefined,
		});
	};

	const handleSetExpiring = () => {
		if (!key) {
			setErrorMessage("请输入键名");
			return;
		}
		if (!valueInput) {
			setErrorMessage("请输入值");
			return;
		}

		setWithExpiration({
			key,
			value: valueInput,
			expirationTtl,
		});
	};

	// 格式化值显示
	const formatValue = (value: unknown): string => {
		if (value === null || value === undefined) return "undefined";

		if (typeof value === "object") {
			try {
				return JSON.stringify(value, null, 2);
			} catch {
				return String(value);
			}
		}

		return String(value);
	};

	return (
		<div className="w-full bg-zinc-900/50 rounded-lg backdrop-blur-sm border border-zinc-800/50 shadow-xl overflow-hidden">
			<div className="p-6">
				<h2 className="text-xl font-semibold text-zinc-100 mb-6">
					Cloudflare KV 存储
				</h2>

				{/* 成功/错误消息 */}
				{successMessage && (
					<div className="mb-4 p-3 bg-green-900/30 border border-green-700/50 rounded-md text-green-300 text-sm">
						{successMessage}
					</div>
				)}
				{errorMessage && (
					<div className="mb-4 p-3 bg-red-900/30 border border-red-700/50 rounded-md text-red-300 text-sm">
						{errorMessage}
					</div>
				)}

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					{/* 左侧：操作区 */}
					<div className="space-y-6">
						<form onSubmit={handleSubmit} className="space-y-4">
							<div>
								<label
									htmlFor="key-input"
									className="block text-sm font-medium text-zinc-400 mb-1"
								>
									键名
								</label>
								<input
									id="key-input"
									type="text"
									value={key}
									onChange={(e) => setKey(e.target.value)}
									className="w-full px-3 py-2 bg-zinc-800/60 border border-zinc-700/50 rounded-md text-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-transparent"
									placeholder="键名"
								/>
							</div>
							<div>
								<label
									htmlFor="value-input"
									className="block text-sm font-medium text-zinc-400 mb-1"
								>
									值
								</label>
								<textarea
									value={valueInput}
									onChange={(e) => setValueInput(e.target.value)}
									className="w-full px-3 py-2 bg-zinc-800/60 border border-zinc-700/50 rounded-md text-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-transparent h-24 font-mono text-sm"
									placeholder="值（字符串或JSON）"
								/>
							</div>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div>
									<label
										htmlFor="type-select"
										className="block text-sm font-medium text-zinc-400 mb-1"
									>
										数据类型
									</label>
									<select
										value={selectedType}
										onChange={(e) => setSelectedType(e.target.value as KVType)}
										className="w-full px-3 py-2 bg-zinc-800/60 border border-zinc-700/50 rounded-md text-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-transparent"
									>
										<option value="text">文本</option>
										<option value="json">JSON</option>
										<option value="arrayBuffer">ArrayBuffer</option>
										<option value="stream">Stream</option>
									</select>
								</div>
								<div>
									<label
										htmlFor="expiration-input"
										className="block text-sm font-medium text-zinc-400 mb-1"
									>
										过期时间（秒）
									</label>
									<input
										type="number"
										value={expirationTtl}
										onChange={(e) => setExpirationTtl(Number(e.target.value))}
										min="0"
										className="w-full px-3 py-2 bg-zinc-800/60 border border-zinc-700/50 rounded-md text-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-transparent"
										placeholder="过期时间（秒）"
									/>
									<p className="text-xs text-zinc-500 mt-1">0表示永不过期</p>
								</div>
							</div>
							<div className="flex flex-wrap gap-3">
								<button
									type="submit"
									disabled={isSettingValue || !key}
									className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{isSettingValue ? "设置中..." : "设置值"}
								</button>
								<button
									type="button"
									onClick={handleSetExpiring}
									disabled={
										isSettingWithExpiration || !key || expirationTtl <= 0
									}
									className="px-4 py-2 bg-purple-700/70 hover:bg-purple-600/70 text-zinc-200 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{isSettingWithExpiration ? "设置中..." : "设置带过期时间"}
								</button>
								<button
									type="button"
									onClick={() => key && deleteKey(key)}
									disabled={isDeletingKey || !key}
									className="px-4 py-2 bg-red-700/60 hover:bg-red-600/60 text-zinc-200 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{isDeletingKey ? "删除中..." : "删除"}
								</button>
							</div>
						</form>

						{/* 当前键值显示 */}
						<div>
							<h3 className="text-sm font-semibold text-zinc-300 mb-2 pb-2 border-b border-zinc-700/50">
								当前值：{key ? key : "未选择"}
							</h3>
							{isKeyLoading ? (
								<div className="text-zinc-400 text-sm animate-pulse">
									加载中...
								</div>
							) : keyData ? (
								<div className="bg-zinc-800/60 rounded-md overflow-hidden">
									<pre className="p-3 text-xs text-zinc-300 font-mono overflow-auto max-h-36">
										{formatValue(keyData.value)}
									</pre>
									<div className="px-3 py-2 border-t border-zinc-700/50 text-xs text-zinc-500">
										类型: <span className="text-zinc-300">{keyData.type}</span>
									</div>
								</div>
							) : (
								<div className="text-zinc-500 text-sm">无数据</div>
							)}
						</div>
					</div>

					{/* 右侧：列表区域 */}
					<div className="space-y-4">
						<div>
							<label
								htmlFor="prefix-input"
								className="block text-sm font-medium text-zinc-400 mb-1"
							>
								前缀过滤
							</label>
							<div className="flex gap-2">
								<input
									type="text"
									value={prefix}
									onChange={(e) => setPrefix(e.target.value)}
									className="flex-1 px-3 py-2 bg-zinc-800/60 border border-zinc-700/50 rounded-md text-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-transparent"
									placeholder="键名前缀（可选）"
								/>
								<button
									type="button"
									onClick={() =>
										queryClient.invalidateQueries({ queryKey: ["kv", "list"] })
									}
									className="px-3 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-sm font-medium rounded-md transition-colors"
								>
									刷新
								</button>
							</div>
						</div>

						<div className="mt-4">
							<h3 className="text-sm font-semibold text-zinc-300 mb-2 pb-2 border-b border-zinc-700/50">
								KV 存储键列表 {listData?.count ? `(${listData.count})` : ""}
							</h3>
							{isListLoading ? (
								<div className="text-zinc-400 text-sm animate-pulse">
									加载中...
								</div>
							) : listData?.keys && listData.keys.length > 0 ? (
								<div className="space-y-2 max-h-80 overflow-y-auto pr-2">
									{listData.keys.map((keyName: string) => (
										<button
											type="button"
											key={keyName}
											onClick={() => setKey(keyName)}
											className={`text-left w-full px-3 py-2 rounded-md text-sm transition-colors hover:bg-zinc-800/80 ${
												key === keyName
													? "bg-zinc-800 border border-zinc-700/70"
													: "bg-zinc-900/40"
											}`}
										>
											<div className="font-mono text-zinc-300 truncate">
												{keyName}
											</div>
										</button>
									))}
								</div>
							) : (
								<div className="text-zinc-500 text-sm py-4">无数据</div>
							)}
						</div>

						{/* 前10个值的预览 */}
						{listData?.keysWithValues && listData.keysWithValues.length > 0 && (
							<div className="mt-4">
								<h3 className="text-sm font-semibold text-zinc-300 mb-2 pb-2 border-b border-zinc-700/50">
									键值预览（前10个）
								</h3>
								<div className="space-y-2 max-h-80 overflow-y-auto pr-2">
									{listData.keysWithValues.map(
										(item: { key: string; value: unknown }) => (
											<div
												key={item.key}
												className="bg-zinc-800/40 rounded-md p-2"
											>
												<div className="font-mono text-xs text-zinc-400 mb-1 truncate">
													{item.key}
												</div>
												<div className="font-mono text-xs text-zinc-300 bg-zinc-900/60 p-2 rounded max-h-20 overflow-auto">
													{formatValue(item.value)}
												</div>
											</div>
										),
									)}
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};
