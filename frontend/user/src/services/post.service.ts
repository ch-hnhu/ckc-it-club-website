import { api } from "@/services/api.service";
import type { PaginatedResponse, ApiResponse } from "@/types/api.types";
import type { Post, PostDetail, PostComment, PostListParams } from "@/types/post.types";

export const postService = {
	/**
	 * Fetch published community posts.
	 * Sort "top"    → sort=reactions_count&order=desc
	 * Sort "newest" → sort=created_at&order=desc
	 */
	getPosts: (params?: PostListParams) =>
		api.get<PaginatedResponse<Post>>("/community/posts", params as Record<string, unknown>),

	/** Fetch a single published post with full content. */
	getPost: (id: number) =>
		api.get<ApiResponse<PostDetail>>(`/community/posts/${id}`),

	/** Fetch top-level comments (with nested replies) for a post. */
	getPostComments: (id: number) =>
		api.get<ApiResponse<PostComment[]>>(`/community/posts/${id}/comments`),
};
