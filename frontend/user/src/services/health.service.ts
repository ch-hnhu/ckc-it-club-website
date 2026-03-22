import { api } from "@/services/api.service";

export interface HealthResponse {
	success: boolean;
	message: string;
	version: string;
	timestamp: string;
}

export const healthService = {
	getHealth: () => api.get<HealthResponse>("/health"),
};
