import { api } from "@/services/api.service";
import type { PaginatedResponse } from "@/types/api.types";
import type { ClubInformation } from "@/types/club-information";

const clubInformationService = {
	async getClubInformations(params?: {
		page?: number;
		per_page?: number;
		search?: string;
		sort?: string;
		order?: "asc" | "desc";
	}): Promise<PaginatedResponse<ClubInformation>> {
		return api.get("/club-informations", params);
	},
};

export default clubInformationService;
