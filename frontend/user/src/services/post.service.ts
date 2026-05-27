import { api } from "@/services/api.service";
import type { PaginatedResponse, ApiResponse } from "@/types/api.types";
import type {
	Post,
	PostDetail,
	PostComment,
	PostListParams,
	ReactionType,
	ReactionToggleResponse,
} from "@/types/post.types";

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

	/**
	 * Toggle a reaction on a post (requires auth).
	 * Same type → removes the reaction. Different type → switches. No reaction → adds.
	 */
	toggleReaction: (postId: number, type: ReactionType) =>
		api.post<ApiResponse<ReactionToggleResponse>>(
			`/community/posts/${postId}/reactions`,
			{ type },
		),
};
