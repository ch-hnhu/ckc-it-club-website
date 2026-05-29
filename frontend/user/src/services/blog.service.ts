import { api } from "@/services/api.service";
import type { PaginatedResponse, ApiResponse } from "@/types/api.types";
import type {
	Blog,
	BlogDetail,
	BlogComment,
	BlogListParams,
	BlogReactionResponse,
} from "@/types/blog.types";

export const blogService = {
	getBlogs: (params?: BlogListParams) =>
		api.get<PaginatedResponse<Blog>>("/community/blogs", params as Record<string, unknown>),

	getBlog: (slug: string) =>
		api.get<ApiResponse<BlogDetail>>(`/community/blogs/${slug}`),

	getBlogComments: (id: number) =>
		api.get<ApiResponse<BlogComment[]>>(`/community/blogs/${id}/comments`),

	toggleReaction: (blogId: number, type: string) =>
		api.post<ApiResponse<BlogReactionResponse>>(`/community/blogs/${blogId}/reactions`, { type }),

	createComment: (blogId: number, content: string, parentId?: number) =>
		api.post<ApiResponse<BlogComment>>(`/community/blogs/${blogId}/comments`, {
			content,
			...(parentId !== undefined ? { parent_id: parentId } : {}),
		}),
};
