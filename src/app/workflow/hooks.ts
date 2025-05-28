"use client";

import { client } from "@/lib/client";
import type { WorkflowStatusResponse } from "@/server/workflows/math-workflow/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";

/**
 * 工作流钩子返回类型
 */
interface UseWorkflowResult {
	inputValue: string;
	setInputValue: (value: string) => void;
	mutationMessage: string;
	errorMessage: string;
	activeWorkflowId: string | null;
	startWorkflow: (params: { initialValue: number }) => void;
	isStartingWorkflow: boolean;
	workflowStatusData: WorkflowStatusResponse | undefined;
	isLoadingStatus: boolean;
	handleSubmit: (e: React.FormEvent) => void;
}

/**
 * 使用工作流的自定义钩子
 * 管理工作流的状态、启动和查询
 */
export function useWorkflow(): UseWorkflowResult {
	const [inputValue, setInputValue] = useState<string>("");
	const [mutationMessage, setMutationMessage] = useState<string>("");
	const [errorMessage, setErrorMessage] = useState<string>("");
	const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(null);

	// 启动工作流
	const { mutate: startWorkflow, isPending: isStartingWorkflow } = useMutation({
		mutationFn: async ({ initialValue }: { initialValue: number }) => {
			const res = await client.workflow.startMathWorkflow.$post({
				initialValue,
			});
			return await res.json();
		},
		onSuccess: (data) => {
			console.log(`data: ${JSON.stringify(data)}`);
			setActiveWorkflowId(null);
			if (data.success && data.workflowId) {
				setMutationMessage(`工作流已启动！ID: ${data.workflowId}`);
				setErrorMessage("");
				setInputValue("");
				setActiveWorkflowId(data.workflowId);
			} else {
				setErrorMessage(data.error || "启动工作流失败，请检查控制台。");
				setMutationMessage("");
			}
		},
		onError: (error: Error) => {
			setErrorMessage(`启动工作流时发生错误: ${error.message}`);
			setMutationMessage("");
			setActiveWorkflowId(null);
		},
	});

	// 获取工作流状态并设置轮询
	const { data: workflowStatusData, isLoading: isLoadingStatus } = useQuery({
		queryKey: ["workflowStatus", activeWorkflowId],
		queryFn: async () => {
			if (!activeWorkflowId) {
				return {
					success: false,
					error: "No active workflow ID",
				};
			}
			const res = await client.workflow.getWorkflowStatus.$get({
				workflowId: activeWorkflowId,
			});
			return await res.json();
		},
		enabled: !!activeWorkflowId,
		refetchInterval: (query) => {
			const data = query.state.data;
			const currentStatus = data?.status?.status;

			// 使用工作流状态值来停止轮询
			if (
				currentStatus === "complete" ||
				currentStatus === "errored" ||
				currentStatus === "terminated"
			) {
				return false;
			}
			return 2000;
		},
		refetchIntervalInBackground: true,
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setMutationMessage("");
		setErrorMessage("");

		const numValue = Number.parseFloat(inputValue);
		if (Number.isNaN(numValue)) {
			setErrorMessage("请输入一个有效的数字。");
			return;
		}
		startWorkflow({ initialValue: numValue });
	};

	/**
	 * 从工作流状态中提取步骤信息
	 * @returns 工作流步骤数组或null
	 */
	const getWorkflowSteps = () => {
		if (!workflowStatusData?.success || !workflowStatusData?.status) {
			return null;
		}

		// 使用扩展的类型来处理Cloudflare Workflows API的响应
		const statusObj = workflowStatusData.status;

		// 使用步骤名称映射或默认名称
		return statusObj;
	};

	return {
		inputValue,
		setInputValue,
		mutationMessage,
		errorMessage,
		activeWorkflowId,
		startWorkflow,
		isStartingWorkflow,
		workflowStatusData,
		isLoadingStatus,
		handleSubmit,
	};
}
