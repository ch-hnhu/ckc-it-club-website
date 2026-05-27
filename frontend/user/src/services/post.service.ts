import { api } from "@/services/api.service";
import type { PaginatedResponse } from "@/types/api.types";
import type { Post, PostListParams } from "@/types/post.types";

export const postService = {
	/**
	 * Fetch published community posts.
	 * Sort "top"    → sort=reactions_count&order=desc
	 * Sort "newest" → sort=created_at&order=desc
	 */
	getPosts: (params?: PostListParams) =>
		api.get<PaginatedResponse<Post>>("/community/posts", params as Record<string, unknown>),
};
