import { api } from "@/services/api.service";
import type { PaginatedResponse, ApiResponse } from "@/types/api.types";
import type {
	CreatePostPayload,
	Post,
	PostDetail,
	PostComment,
	PostListParams,
	PostReportReason,
	ReactionType,
	ReactionToggleResponse,
	UpdatePostPayload,
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

	/** Update own post fields (requires auth, owner only). Uses FormData when media is supplied. */
	updatePost: (postId: number, payload: UpdatePostPayload) => {
		if (payload.media !== undefined && payload.media !== null) {
			const formData = new FormData();
			if (payload.title !== undefined) formData.append("title", payload.title);
			if (payload.content !== undefined) formData.append("content", payload.content);
			if (payload.channelSlug !== undefined) formData.append("channel_slug", payload.channelSlug);
			if (payload.visibility !== undefined) formData.append("visibility", payload.visibility);
			if (payload.isPinned !== undefined) formData.append("is_pinned", payload.isPinned ? "1" : "0");
			if (payload.status !== undefined) formData.append("status", payload.status);
			formData.append("media", payload.media);
			return api.patchForm<ApiResponse<Post>>(`/community/posts/${postId}`, formData);
		}
		const body: Record<string, unknown> = {};
		if (payload.title !== undefined) body["title"] = payload.title;
		if (payload.content !== undefined) body["content"] = payload.content;
		if (payload.channelSlug !== undefined) body["channel_slug"] = payload.channelSlug;
		if (payload.visibility !== undefined) body["visibility"] = payload.visibility;
		if (payload.isPinned !== undefined) body["is_pinned"] = payload.isPinned;
		if (payload.status !== undefined) body["status"] = payload.status;
		return api.patch<ApiResponse<Post>>(`/community/posts/${postId}`, body);
	},

	/** Soft-delete own post (requires auth, owner only). */
	deletePost: (postId: number) =>
		api.delete<ApiResponse<null>>(`/community/posts/${postId}`),

	/** Report a post (requires auth, cannot report own post). */
	reportPost: (postId: number, reason: PostReportReason, description?: string) =>
		api.post<ApiResponse<null>>(`/community/posts/${postId}/report`, {
			reason,
			...(description ? { description } : {}),
		}),

	/** Get current user's archived posts (requires auth). */
	getArchivedPosts: () =>
		api.get<PaginatedResponse<Post>>("/community/posts/archived"),

	/**
	 * Create a top-level comment or a reply on a post (requires auth).
	 * Pass parentId to reply to an existing comment.
	 */
	createComment: (postId: number, content: string, parentId?: number) =>
		api.post<ApiResponse<PostComment>>(`/community/posts/${postId}/comments`, {
			content,
			...(parentId !== undefined ? { parent_id: parentId } : {}),
		}),

	/** Toggle a reaction on a comment (requires auth). */
	toggleCommentReaction: (commentId: number, type: ReactionType) =>
		api.post<ApiResponse<{ reacted: boolean; my_reaction: ReactionType | null; reactions_count: number }>>(
			`/community/comments/${commentId}/reactions`,
			{ type },
		),
};
