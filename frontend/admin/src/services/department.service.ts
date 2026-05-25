import { api } from "@/services/api.service";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type { Department, DepartmentDetail } from "@/types/department.type";

const departmentService = {
	async getDepartments(params?: {
		page?: number;
		per_page?: number;
		search?: string;
		sort?: string;
		order?: "asc" | "desc";
	}): Promise<PaginatedResponse<Department>> {
		return api.get("/departments", params);
	},

	async getDepartment(id: number | string): Promise<ApiResponse<DepartmentDetail>> {
		return api.get(`/departments/${id}`);
	},

	async getDeletedDepartments(params?: {
		page?: number;
		per_page?: number;
		search?: string;
		sort?: string;
		order?: "asc" | "desc";
	}): Promise<PaginatedResponse<Department>> {
		return api.get("/departments/trash", params);
	},

	async createDepartment(payload: {
		name: string;
		description?: string | null;
		is_active?: boolean;
		head_role_id?: number | null;
	}): Promise<ApiResponse<Department>> {
		return api.post<ApiResponse<Department>, typeof payload>("/departments", payload);
	},

	async updateDepartment(
		id: number | string,
		payload: {
			name: string;
			description?: string | null;
			is_active?: boolean;
			head_role_id?: number | null;
		},
	): Promise<ApiResponse<Department>> {
		return api.put<ApiResponse<Department>, typeof payload>(`/departments/${id}`, payload);
	},

	async deleteDepartment(id: number | string): Promise<ApiResponse<null>> {
		return api.delete(`/departments/${id}`);
	},

	async restoreDepartment(id: number | string): Promise<ApiResponse<Department>> {
		return api.patch<ApiResponse<Department>, undefined>(`/departments/${id}/restore`);
	},

	async forceDeleteDepartment(id: number | string): Promise<ApiResponse<null>> {
		return api.delete(`/departments/${id}/force`);
	},

	async addDepartmentUser(
		id: number | string,
		payload: {
			user_id: number;
			joined_at?: string | null;
		},
	): Promise<ApiResponse<Department>> {
		return api.post<ApiResponse<Department>, typeof payload>(
			`/departments/${id}/users`,
			payload,
		);
	},

	async updateDepartmentUserRole(
		id: number | string,
		userId: number | string,
		payload: {
			is_head: boolean;
		},
	): Promise<ApiResponse<Department>> {
		return api.patch<ApiResponse<Department>, typeof payload>(
			`/departments/${id}/users/${userId}`,
			payload,
		);
	},

	async removeDepartmentUser(
		id: number | string,
		userId: number | string,
	): Promise<ApiResponse<Department>> {
		return api.delete(`/departments/${id}/users/${userId}`);
	},
};

export default departmentService;
