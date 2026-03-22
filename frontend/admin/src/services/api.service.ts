import apiClient from "@/config/axios.config";

export const api = {
	get: async <TResponse>(url: string, params?: Record<string, unknown>) => {
		const response = await apiClient.get<TResponse>(url, { params });
		return response.data;
	},

	post: async <TResponse, TBody = unknown>(url: string, body?: TBody) => {
		const response = await apiClient.post<TResponse>(url, body);
		return response.data;
	},

	put: async <TResponse, TBody = unknown>(url: string, body?: TBody) => {
		const response = await apiClient.put<TResponse>(url, body);
		return response.data;
	},

	patch: async <TResponse, TBody = unknown>(url: string, body?: TBody) => {
		const response = await apiClient.patch<TResponse>(url, body);
		return response.data;
	},

	delete: async <TResponse>(url: string) => {
		const response = await apiClient.delete<TResponse>(url);
		return response.data;
	},
};
