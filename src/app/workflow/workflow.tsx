"use client";

import { useWorkflow } from "./hooks";

export function WorkflowManager() {
	const {
		inputValue,
		setInputValue,
		mutationMessage,
		errorMessage,
		activeWorkflowId,
		isStartingWorkflow,
		workflowStatusData,
		isLoadingStatus,
		handleSubmit,
	} = useWorkflow();

	return (
		<div className="w-full max-w-lg bg-zinc-900/50 rounded-lg backdrop-blur-sm border border-zinc-800/50 shadow-xl overflow-hidden p-6 space-y-6">
			<h2 className="text-xl font-semibold text-zinc-100 text-center">
				数学工作流管理器
			</h2>

			<form onSubmit={handleSubmit} className="space-y-4">
				<div>
					<label
						htmlFor="initial-value-input"
						className="block text-sm font-medium text-zinc-400 mb-1"
					>
						输入一个数字
					</label>
					<input
						id="initial-value-input"
						type="number"
						value={inputValue}
						onChange={(e) => setInputValue(e.target.value)}
						className="w-full px-3 py-2 bg-zinc-800/60 border border-zinc-700/50 rounded-md text-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-transparent"
						placeholder="例如: 10"
						step="any"
					/>
				</div>

				<button
					type="submit"
					disabled={isStartingWorkflow || !inputValue}
					className="w-full px-4 py-2 bg-purple-700/70 hover:bg-purple-600/70 text-zinc-100 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{isStartingWorkflow ? "启动中..." : "启动工作流"}
				</button>
			</form>

			{mutationMessage && (
				<div className="p-3 bg-blue-900/30 border border-blue-700/50 rounded-md text-blue-300 text-sm">
					{mutationMessage}
				</div>
			)}

			{errorMessage && (
				<div className="p-3 bg-red-900/30 border border-red-700/50 rounded-md text-red-300 text-sm">
					{errorMessage}
				</div>
			)}

			{activeWorkflowId && (
				<div className="mt-4 p-4 bg-zinc-800/70 rounded-md space-y-2 border border-zinc-700/50">
					{isLoadingStatus && !workflowStatusData && (
						<p className="text-sm text-zinc-400 animate-pulse">
							正在加载状态...
						</p>
					)}
					{workflowStatusData && (
						<div className="text-sm">
							<p className="text-zinc-300">
								当前状态:{" "}
								<span
									className={`font-semibold ${
										workflowStatusData.status?.status === "complete"
											? "text-green-400"
											: workflowStatusData.status?.status === "errored" ||
													workflowStatusData.status?.status === "terminated"
												? "text-red-400"
												: "text-yellow-400"
									}`}
								>
									{workflowStatusData.status?.status}
								</span>
							</p>
							{/* 工作流步骤状态显示区域 */}
							<div className="mt-3 border-t border-zinc-700/50 pt-3">
								<h4 className="text-sm font-medium text-zinc-300 mb-2">
									最终输出:
								</h4>
								<pre className="p-2 bg-zinc-900 rounded text-xs text-zinc-300 overflow-auto max-h-40">
									{JSON.stringify(workflowStatusData, null, 2)}
								</pre>
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
