import { api } from "@/services/api.service";
import type { PaginatedResponse, ApiResponse } from "@/types/api.types";
import type {
	Blog,
	BlogDetail,
	BlogComment,
	BlogListParams,
	CreateBlogPayload,
	BlogReactionResponse,
} from "@/types/blog.types";

export const blogService = {
	getBlogs: (params?: BlogListParams) =>
		api.get<PaginatedResponse<Blog>>("/community/blogs", params as Record<string, unknown>),

	getTags: () => api.get<ApiResponse<Blog["tags"]>>("/community/blog-tags"),

	getBlog: (slug: string) =>
		api.get<ApiResponse<BlogDetail>>(`/community/blogs/${slug}`),

	createBlog: (payload: CreateBlogPayload) => {
		const formData = new FormData();
		formData.append("title", payload.title);
		formData.append("content", payload.content);

		if (payload.excerpt) {
			formData.append("excerpt", payload.excerpt);
		}

		if (payload.featuredImage) {
			formData.append("featured_image", payload.featuredImage);
		}

		if (payload.status) {
			formData.append("status", payload.status);
		}

		payload.tagIds?.forEach((tagId) => {
			formData.append("tag_ids[]", String(tagId));
		});

		return api.postForm<ApiResponse<BlogDetail>>("/community/blogs", formData);
	},

	getMyDraftBlogs: (page = 1) =>
		api.get<PaginatedResponse<Blog>>("/community/blogs/my-drafts", { page, per_page: 20 }),

	updateBlog: (slug: string, payload: CreateBlogPayload) => {
		const formData = new FormData();
		if (payload.title) formData.append("title", payload.title);
		if (payload.content) formData.append("content", payload.content);
		if (payload.excerpt !== undefined) formData.append("excerpt", payload.excerpt ?? "");
		if (payload.status) formData.append("status", payload.status);
		if (payload.featuredImage) formData.append("featured_image", payload.featuredImage);
		payload.tagIds?.forEach((id) => formData.append("tag_ids[]", String(id)));
		// POST /update fallback vì PATCH + FormData không ổn định trên một số browser/server
		return api.postForm<ApiResponse<BlogDetail>>(`/community/blogs/${slug}/update`, formData);
	},

	getBlogComments: (id: number) =>
		api.get<ApiResponse<BlogComment[]>>(`/community/blogs/${id}/comments`),

	toggleReaction: (blogId: number, type: string) =>
		api.post<ApiResponse<BlogReactionResponse>>(`/community/blogs/${blogId}/reactions`, { type }),

	toggleBookmark: (blogId: number) =>
		api.post<ApiResponse<{ bookmarked: boolean }>>(`/community/blogs/${blogId}/bookmark`),

	getBookmarkedBlogs: (page = 1) =>
		api.get<PaginatedResponse<Blog>>("/community/blogs/bookmarks", { page, per_page: 20 }),

	/** Get current user's archived blogs (requires auth). */
	getArchivedBlogs: (page = 1) =>
		api.get<PaginatedResponse<Blog>>("/community/blogs/archived", { page, per_page: 20 }),

	createComment: (blogId: number, content: string, parentId?: number) =>
		api.post<ApiResponse<BlogComment>>(`/community/blogs/${blogId}/comments`, {
			content,
			...(parentId !== undefined ? { parent_id: parentId } : {}),
		}),

	pinBlog: (blogId: number, isPinned: boolean) =>
		api.post<ApiResponse<{ is_pinned: boolean }>>(`/community/blogs/${blogId}/pin`, { is_pinned: isPinned }),
};
