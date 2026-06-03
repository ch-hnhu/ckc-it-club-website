// Types for Community Post API (user-facing)

export type ReactionType = "heart" | "like" | "haha" | "wow" | "sad";

export interface ReactionSummary {
	heart?: number;
	like?: number;
	haha?: number;
	wow?: number;
	sad?: number;
}

export interface ReactionToggleResponse {
	reacted: boolean;
	my_reaction: ReactionType | null;
	reactions_count: number;
	reaction_summary: ReactionSummary;
}

export interface PostUser {
	id: number;
	full_name: string;
	username: string | null;
	email: string;
	avatar: string | null;
	student_code: string | null;
}

export interface PostChannel {
	id: number;
	name: string;
	slug: string;
}

export interface Post {
	id: number;
	slug: string;
	user: PostUser | null;
	channel: PostChannel | null;
	title: string;
	content?: string;
	excerpt: string;
	is_excerpt_truncated?: boolean;
	featured_image: string | null;
	status: string;
	visibility: string;
	is_pinned: boolean;
	comments_count: number;
	reactions_count: number;
	/** Type of current user's reaction, null if not reacted or guest */
	my_reaction: ReactionType | null;
	/** Whether the current authenticated user has bookmarked this post */
	my_bookmark?: boolean;
	/** Whether the current authenticated user has reported this post */
	my_report?: boolean;
	tags: string[];
	media_urls: string[];
	created_at: string;
}

/** Full post with content field (detail page) */
export interface PostDetail extends Post {
	content: string;
	reaction_summary: ReactionSummary;
}

export interface PostListParams {
	page?: number;
	per_page?: number;
	/** Channel slug. Pass "all" or omit to fetch all channels. */
	channel?: string;
	/** Filter by author username */
	username?: string;
	/** Sort by reactions (top) or date (newest). Default: created_at */
	sort?: "created_at" | "reactions_count";
	order?: "asc" | "desc";
}

export interface CreatePostPayload {
	channelSlug: string;
	title: string;
	content: string;
	visibility?: "public" | "members" | "private";
	media?: File | null;
}

export type PostReportReason = "spam" | "offensive" | "misinformation" | "inappropriate" | "other";

export interface UpdatePostPayload {
	title?: string;
	content?: string;
	channelSlug?: string;
	visibility?: "public" | "members" | "private";
	isPinned?: boolean;
	status?: "published" | "archived";
	media?: File | null;
}

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------

export interface CommentUser {
	id: number;
	full_name: string;
	username: string | null;
	email: string;
	avatar: string | null;
}

export interface PostComment {
	id: number;
	parent_id: number | null;
	user: CommentUser | null;
	content: string | null;
	is_hidden: boolean;
	reactions_count: number;
	my_reaction: ReactionType | null;
	created_at: string;
	replies: PostComment[];
}
