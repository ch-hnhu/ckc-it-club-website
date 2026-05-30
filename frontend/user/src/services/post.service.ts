import { api } from "@/services/api.service";
import type { PaginatedResponse, ApiResponse } from "@/types/api.types";
import type {
	CreatePostPayload,
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
	getPost: (id: number) => api.get<ApiResponse<PostDetail>>(`/community/posts/${id}`),

	/** Create a published community post with optional image/video media. */
	createPost: (payload: CreatePostPayload) => {
		const formData = new FormData();
		formData.append("channel_slug", payload.channelSlug);
		formData.append("title", payload.title);
		formData.append("content", payload.content);
		formData.append("visibility", payload.visibility ?? "public");

		if (payload.media) {
			formData.append("media", payload.media);
		}

		return api.postForm<ApiResponse<PostDetail>>("/community/posts", formData);
	},

	/** Fetch top-level comments (with nested replies) for a post. */
	getPostComments: (id: number) =>
		api.get<ApiResponse<PostComment[]>>(`/community/posts/${id}/comments`),

	/**
	 * Toggle a reaction on a post (requires auth).
	 * Same type → removes the reaction. Different type → switches. No reaction → adds.
	 */
	toggleReaction: (postId: number, type: ReactionType) =>
		api.post<ApiResponse<ReactionToggleResponse>>(`/community/posts/${postId}/reactions`, {
			type,
		}),

	/** Toggle bookmark on a post (requires auth). */
	toggleBookmark: (postId: number) =>
		api.post<ApiResponse<{ bookmarked: boolean }>>(`/community/posts/${postId}/bookmark`),

	/**
	 * Create a top-level comment or a reply on a post (requires auth).
	 * Pass parentId to reply to an existing comment.
	 */
	createComment: (postId: number, content: string, parentId?: number) =>
		api.post<ApiResponse<PostComment>>(`/community/posts/${postId}/comments`, {
			content,
			...(parentId !== undefined ? { parent_id: parentId } : {}),
		}),
};
