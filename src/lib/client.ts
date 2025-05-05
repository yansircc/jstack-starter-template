import type { AppRouter } from "@/server";
import { createClient } from "jstack";
import { getBackendUrl } from "./utils";

// 基础客户端：不带认证，用于公共请求
export const client = createClient<AppRouter>({
	baseUrl: `${getBackendUrl()}/api`,
});

// 客户端认证客户端（用于客户端组件，支持异步获取 token）
export const createAuthClient = (getToken: () => Promise<string | null>) => {
	return createClient<AppRouter>({
		baseUrl: `${getBackendUrl()}/api`,
		headers: async () => {
			const token = await getToken();
			return { Authorization: token ? `Bearer ${token}` : "" };
		},
	});
};
