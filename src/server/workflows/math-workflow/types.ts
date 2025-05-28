import type { InstanceStatus } from "@cloudflare/workers-types";
import { z } from "zod";

/**
 * 数学工作流参数接口
 */
// export interface MathWorkflowParams {
// 	initialValue: number;
// }

export const MathWorkflowParams = z.object({
	initialValue: z.number(),
});

export type MathWorkflowParams = z.infer<typeof MathWorkflowParams>;

/**
 * 工作流响应基础接口
 */
interface WorkflowResponse<T = unknown> {
	success: boolean;
	error?: string;
	data?: T;
}

/**
 * 工作流创建响应接口
 */
export interface WorkflowCreateResponse extends WorkflowResponse {
	workflowId?: string;
}

/**
 * 工作流状态响应接口
 */
export interface WorkflowStatusResponse extends WorkflowResponse {
	status?: InstanceStatus;
}
