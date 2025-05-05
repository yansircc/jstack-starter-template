type KVType = "text" | "json" | "arrayBuffer" | "stream";

// 定义API返回类型
interface KVGetResponse {
	key: string;
	value: unknown;
	type: string;
	success?: boolean;
}

interface KVSetResponse {
	key: string;
	success: boolean;
	expiresIn?: string;
	error?: string;
}

interface KVDeleteResponse {
	key: string;
	success: boolean;
	error?: string;
}

interface KVSetWithExpirationResponse {
	key: string;
	value?: string;
	expiresIn?: string;
	success: boolean;
	error?: string;
}

interface KVListResponse {
	keys?: string[];
	complete?: boolean;
	count?: number;
	keysWithValues?: Array<{ key: string; value: unknown }>;
	success: boolean;
	error?: string;
}

export type {
	KVType,
	KVGetResponse,
	KVSetResponse,
	KVDeleteResponse,
	KVSetWithExpirationResponse,
	KVListResponse,
};
