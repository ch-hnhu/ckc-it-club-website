import apiClient from "@/config/axios.config";
import { api } from "@/services/api.service";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type {
	AcademicStructureImportRecord,
	AcademicStructureImportStats,
	AcademicStructureImportSummary,
} from "@/types/academic-structure.type";

const academicStructureService = {
	async importStructure(file: File): Promise<ApiResponse<AcademicStructureImportSummary>> {
		const formData = new FormData();
		formData.append("file", file);

		return api.post<ApiResponse<AcademicStructureImportSummary>, FormData>(
			"/academic-structure/import",
			formData,
			{
				headers: {
					"Content-Type": "multipart/form-data",
				},
			},
		);
	},

	async getImportHistories(params?: {
		page?: number;
		per_page?: number;
		search?: string;
		sort?: string;
		order?: "asc" | "desc";
		status?: string;
		type?: string;
	}): Promise<PaginatedResponse<AcademicStructureImportRecord>> {
		return api.get<PaginatedResponse<AcademicStructureImportRecord>>(
			"/academic-structure/imports",
			params,
		);
	},

	async getImportStats(): Promise<ApiResponse<AcademicStructureImportStats>> {
		return api.get<ApiResponse<AcademicStructureImportStats>>(
			"/academic-structure/imports/stats",
		);
	},

	async downloadImportFile(importId: number): Promise<Blob> {
		const response = await apiClient.get<Blob>(
			`/academic-structure/imports/${importId}/download`,
			{
				responseType: "blob",
			},
		);

		return response.data;
	},
};

export default academicStructureService;
