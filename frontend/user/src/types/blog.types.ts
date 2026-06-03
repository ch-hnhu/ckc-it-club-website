export type ReactionType = "heart" | "like" | "haha" | "wow" | "sad";

export interface BlogAuthor {
	id: number;
	full_name: string;
	email: string;
	avatar: string | null;
	username: string | null;
	role?: string | null;
	is_following?: boolean;
}

export interface BlogTag {
	id: number;
	name: string;
	color: string | null;
}

export interface Blog {
	id: number;
	slug: string;
	user: BlogAuthor | null;
	title: string;
	excerpt: string | null;
	featured_image: string | null;
	status: string;
	is_pinned?: boolean;
	published_at: string | null;
	view_count: number;
	comments_count: number;
	reactions_count: number;
	my_reaction: ReactionType | null;
	tags: BlogTag[];
	created_at: string;
	updated_at: string;
}

export interface BlogDetail extends Blog {
	content: string;
	reaction_summary: Record<string, number>;
	my_bookmark: boolean;
}

export interface BlogComment {
	id: number;
	parent_id: number | null;
	user: {
		id: number;
		full_name: string;
		username: string | null;
		email: string;
		avatar: string | null;
	} | null;
	content: string;
	reactions_count: number;
	created_at: string;
	replies: BlogComment[];
}

export interface BlogListParams {
	page?: number;
	per_page?: number;
	search?: string;
	tag?: string;
	username?: string;
	sort?: "published_at" | "reactions_count" | "view_count" | "created_at";
	order?: "asc" | "desc";
}

export interface CreateBlogPayload {
	title: string;
	content: string;
	excerpt?: string;
	tagIds?: number[];
	featuredImage?: File | null;
	status?: "draft" | "pending_review";
}

export interface BlogReactionResponse {
	reacted: boolean;
	my_reaction: ReactionType | null;
	reactions_count: number;
	reaction_summary: Record<string, number>;
}
