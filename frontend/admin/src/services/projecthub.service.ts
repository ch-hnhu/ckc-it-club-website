import { api } from "@/services/api.service";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";
import type {
	AssignableUser,
	CreateProjectInput,
	CreateTaskInput,
	Project,
	ProjectColumn,
	ProjectDetail,
	ProjectMember,
	ProjectMemberRole,
	ProjectTask,
	UpdateTaskInput,
} from "@/types/projecthub.types";

const BASE = "/projecthub/boards";

// ProjectHub API — yêu cầu đăng nhập (auth:sanctum), chỉ thành viên của board.
export const projectHubService = {
	// ── Boards ──────────────────────────────────────────────────────────────
	listProjects: (params?: { archived?: 0 | 1; page?: number; per_page?: number }) =>
		api.get<PaginatedResponse<Project>>(BASE, params as Record<string, unknown>),

	getProject: (slug: string) => api.get<ApiResponse<ProjectDetail>>(`${BASE}/${slug}`),

	createProject: (body: CreateProjectInput) => api.post<ApiResponse<Project>>(BASE, body),

	updateProject: (slug: string, body: Partial<CreateProjectInput>) =>
		api.patch<ApiResponse<Project>>(`${BASE}/${slug}`, body),

	archiveProject: (slug: string) =>
		api.patch<ApiResponse<{ is_archived: boolean }>>(`${BASE}/${slug}/archive`),

	deleteProject: (slug: string) => api.delete<ApiResponse<null>>(`${BASE}/${slug}`),

	// ── Columns ─────────────────────────────────────────────────────────────
	createColumn: (slug: string, body: { name: string; color?: string | null; wip_limit?: number | null }) =>
		api.post<ApiResponse<ProjectColumn>>(`${BASE}/${slug}/columns`, body),

	updateColumn: (
		slug: string,
		columnId: number,
		body: { name?: string; color?: string | null; wip_limit?: number | null },
	) => api.patch<ApiResponse<ProjectColumn>>(`${BASE}/${slug}/columns/${columnId}`, body),

	deleteColumn: (slug: string, columnId: number) =>
		api.delete<ApiResponse<null>>(`${BASE}/${slug}/columns/${columnId}`),

	reorderColumns: (slug: string, columnIds: number[]) =>
		api.patch<ApiResponse<null>>(`${BASE}/${slug}/columns/reorder`, { column_ids: columnIds }),

	// ── Tasks ───────────────────────────────────────────────────────────────
	createTask: (slug: string, body: CreateTaskInput) =>
		api.post<ApiResponse<ProjectTask>>(`${BASE}/${slug}/tasks`, body),

	updateTask: (slug: string, taskId: number, body: UpdateTaskInput) =>
		api.patch<ApiResponse<ProjectTask>>(`${BASE}/${slug}/tasks/${taskId}`, body),

	deleteTask: (slug: string, taskId: number) =>
		api.delete<ApiResponse<null>>(`${BASE}/${slug}/tasks/${taskId}`),

	moveTask: (slug: string, taskId: number, body: { column_id: number; position: number }) =>
		api.patch<ApiResponse<{ id: number; column_id: number }>>(
			`${BASE}/${slug}/tasks/${taskId}/move`,
			body,
		),

	// ── Members ─────────────────────────────────────────────────────────────
	getMembers: (slug: string) => api.get<ApiResponse<ProjectMember[]>>(`${BASE}/${slug}/members`),

	searchAssignableUsers: (slug: string, search: string) =>
		api.get<ApiResponse<AssignableUser[]>>(`${BASE}/${slug}/assignable-users`, { search }),

	addMember: (slug: string, body: { user_id: number; role?: ProjectMemberRole }) =>
		api.post<ApiResponse<ProjectMember>>(`${BASE}/${slug}/members`, body),

	updateMemberRole: (slug: string, userId: number, role: ProjectMemberRole) =>
		api.patch<ApiResponse<{ user_id: number; role: ProjectMemberRole }>>(
			`${BASE}/${slug}/members/${userId}`,
			{ role },
		),

	removeMember: (slug: string, userId: number) =>
		api.delete<ApiResponse<null>>(`${BASE}/${slug}/members/${userId}`),
};
