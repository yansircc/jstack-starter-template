import {
	WorkflowEntrypoint,
	type WorkflowEvent,
	type WorkflowStep,
} from "cloudflare:workers";
import type { Env } from "../../jstack";
import type { MathWorkflowParams } from "./types";

/**
 * 数学工作流 - 执行一系列数学运算并返回结果
 */
export class MathWorkflow extends WorkflowEntrypoint<
	Env["Bindings"],
	MathWorkflowParams
> {
	async run(
		event: WorkflowEvent<MathWorkflowParams>,
		step: WorkflowStep,
	): Promise<number> {
		const { initialValue } = event.payload;

		try {
			// 步骤 1: 乘以 2
			const multipliedValue = await step.do(
				"multiply",
				{ retries: { limit: 3, delay: "1 second" } },
				async () => {
					console.log(`工作流步骤 1: ${initialValue} * 2`);
					return initialValue * 2;
				},
			);

			// 步骤 2: 除以 3
			const dividedValue = await step.do(
				"divide",
				{ retries: { limit: 3, delay: "1 second" } },
				async () => {
					console.log(`工作流步骤 2: ${multipliedValue} / 3`);
					// 为了演示，添加一个等待时间
					await step.sleep("waitBeforeDivide", "10 seconds");
					const result = multipliedValue / 3;
					console.log(`除法计算结果: ${result}`);
					return result;
				},
			);

			// 步骤 3: 计算平方根
			const sqrtValue = await step.do(
				"sqrt",
				{ retries: { limit: 3, delay: "1 second" } },
				async () => {
					console.log(`工作流步骤 3: √${dividedValue}`);
					await step.sleep("waitBeforeSqrt", "1 second");
					const result = Math.sqrt(dividedValue);
					console.log(`平方根计算结果: ${result}`);
					return result;
				},
			);

			// 步骤 4: 四舍五入
			const finalResult = await step.do(
				"round",
				{ retries: { limit: 3, delay: "1 second" } },
				async () => {
					console.log(`工作流步骤 4: round(${sqrtValue})`);
					// 模拟一个可能的错误情况（当结果小于1时）
					if (sqrtValue < 1) {
						throw new Error("结果太小，无法执行四舍五入操作");
					}
					const result = Math.round(sqrtValue);
					console.log(`四舍五入结果: ${result}`);
					return result;
				},
			);

			return finalResult;
		} catch (error) {
			console.error("工作流执行失败:", error);
			throw error;
		}
	}
}
