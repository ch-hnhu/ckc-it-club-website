import { api } from "@/services/api.service";
import type { ApiResponse } from "@/types/api.types";
import type { AcademicStructureImportSummary } from "@/types/academic-structure.type";

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
};

export default academicStructureService;
