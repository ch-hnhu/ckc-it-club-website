// Types for Community Post API (user-facing)

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
	user: PostUser | null;
	channel: PostChannel | null;
	title: string;
	excerpt: string;
	featured_image: string | null;
	status: string;
	visibility: string;
	is_pinned: boolean;
	comments_count: number;
	reactions_count: number;
	tags: string[];
	media_urls: string[];
	created_at: string;
}

/** Full post with content field (detail page) */
export interface PostDetail extends Post {
	content: string;
}

export interface PostListParams {
	page?: number;
	per_page?: number;
	/** Channel slug. Pass "all" or omit to fetch all channels. */
	channel?: string;
	/** Sort by reactions (top) or date (newest). Default: created_at */
	sort?: "created_at" | "reactions_count";
	order?: "asc" | "desc";
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
	content: string;
	reactions_count: number;
	created_at: string;
	replies: PostComment[];
}
