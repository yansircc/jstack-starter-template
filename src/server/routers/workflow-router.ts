import type {
	WorkflowCreateResponse,
	WorkflowStatusResponse,
} from "@/server/workflows/math-workflow/types";
import { MathWorkflowParams } from "@/server/workflows/math-workflow/types";
import type { InstanceStatus } from "@cloudflare/workers-types";
import { z } from "zod";
import { j, publicProcedure } from "../jstack";

/**
 * 工作流路由
 */
export const workflowRouter = j.router({
	// 启动数学工作流
	startMathWorkflow: publicProcedure
		.input(MathWorkflowParams)
		.mutation(async ({ ctx, c, input }) => {
			const { mathWorkflow } = ctx;

			if (!mathWorkflow) {
				return c.superjson<WorkflowCreateResponse>(
					{
						success: false,
						error: "工作流服务未正确配置",
					},
					500,
				);
			}

			try {
				const instance = await mathWorkflow.create({
					params: input,
				});

				return c.superjson<WorkflowCreateResponse>({
					success: true,
					workflowId: instance.id,
				});
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : String(error);
				console.error("启动工作流失败:", errorMessage);

				return c.superjson<WorkflowCreateResponse>(
					{
						success: false,
						error: `启动工作流失败: ${errorMessage}`,
					},
					500,
				);
			}
		}),

	// 获取工作流状态
	getWorkflowStatus: publicProcedure
		.input(z.object({ workflowId: z.string() }))
		.query(async ({ ctx, c, input }) => {
			const { mathWorkflow } = ctx;
			const { workflowId } = input;

			if (!mathWorkflow) {
				return c.superjson<WorkflowStatusResponse>(
					{
						success: false,
						error: "工作流服务未正确配置",
					},
					500,
				);
			}

			try {
				const instance = await mathWorkflow.get(workflowId);
				const rawStatus = await instance.status();

				// 记录日志
				console.log(
					`工作流 ${workflowId} 状态详情:`,
					JSON.stringify(rawStatus, null, 2),
				);

				// 将InstanceStatus转换为ExtendedInstanceStatus
				const status: InstanceStatus = {
					...rawStatus,
					output: rawStatus.output,
				};

				return c.superjson<WorkflowStatusResponse>({
					success: true,
					status,
				});
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : String(error);
				console.error(`获取工作流 ${workflowId} 状态失败:`, errorMessage);

				return c.superjson<WorkflowStatusResponse>(
					{
						success: false,
						error: `获取工作流状态失败: ${errorMessage}`,
					},
					500,
				);
			}
		}),
});
