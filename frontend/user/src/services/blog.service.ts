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

		payload.tagIds?.forEach((tagId) => {
			formData.append("tag_ids[]", String(tagId));
		});

		return api.postForm<ApiResponse<BlogDetail>>("/community/blogs", formData);
	},

	getBlogComments: (id: number) =>
		api.get<ApiResponse<BlogComment[]>>(`/community/blogs/${id}/comments`),

	toggleReaction: (blogId: number, type: string) =>
		api.post<ApiResponse<BlogReactionResponse>>(`/community/blogs/${blogId}/reactions`, { type }),

	toggleBookmark: (blogId: number) =>
		api.post<ApiResponse<{ bookmarked: boolean }>>(`/community/blogs/${blogId}/bookmark`),

	getBookmarkedBlogs: (page = 1) =>
		api.get<PaginatedResponse<Blog>>("/community/blogs/bookmarks", { page, per_page: 20 }),

	createComment: (blogId: number, content: string, parentId?: number) =>
		api.post<ApiResponse<BlogComment>>(`/community/blogs/${blogId}/comments`, {
			content,
			...(parentId !== undefined ? { parent_id: parentId } : {}),
		}),
};
