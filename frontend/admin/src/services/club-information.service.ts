import { api } from "@/services/api.service";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type { ClubInformation, ClubInformationValue } from "@/types/club-information";

export type CreateClubInformationPayload = {
	label: string;
	value: string;
	slug: string;
	type: string;
	description?: string;
	is_active: boolean;
};

export type UpdateClubInformationPayload = {
	slug: string;
	description?: string;
};

export type CreateClubInformationValuePayload = {
	value: string;
	link?: string;
	alt?: string;
	position?: number | null;
	is_active: boolean;
};

export type UpdateClubInformationValuePayload = CreateClubInformationValuePayload;

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

	async getClubInformation(
		id: number,
		params?: {
			search?: string;
			sort?: string;
			order?: "asc" | "desc";
		},
	): Promise<{ success: boolean; data: ClubInformation }> {
		return api.get(`/club-informations/${id}`, params);
	},

	async createClubInformation(
		payload: CreateClubInformationPayload,
	): Promise<ApiResponse<ClubInformation>> {
		return api.post<ApiResponse<ClubInformation>, CreateClubInformationPayload>(
			"/club-informations",
			payload,
		);
	},

	async updateClubInformation(
		id: number,
		payload: UpdateClubInformationPayload,
	): Promise<ApiResponse<ClubInformation>> {
		return api.put<ApiResponse<ClubInformation>, UpdateClubInformationPayload>(
			`/club-informations/${id}`,
			payload,
		);
	},

	async createClubInformationValue(
		clubInformationId: number,
		payload: CreateClubInformationValuePayload,
	): Promise<ApiResponse<ClubInformationValue>> {
		return api.post<ApiResponse<ClubInformationValue>, CreateClubInformationValuePayload>(
			`/club-informations/${clubInformationId}/values`,
			payload,
		);
	},

	async updateClubInformationValue(
		clubInformationId: number,
		valueId: number,
		payload: UpdateClubInformationValuePayload,
	): Promise<ApiResponse<ClubInformationValue>> {
		return api.put<ApiResponse<ClubInformationValue>, UpdateClubInformationValuePayload>(
			`/club-informations/${clubInformationId}/values/${valueId}`,
			payload,
		);
	},

	async deleteClubInformationValue(
		clubInformationId: number,
		valueId: number,
	): Promise<ApiResponse<{ id: number }>> {
		return api.delete<ApiResponse<{ id: number }>>(
			`/club-informations/${clubInformationId}/values/${valueId}`,
		);
	},
};

export default clubInformationService;
