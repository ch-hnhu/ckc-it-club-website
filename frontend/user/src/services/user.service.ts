import { api } from "@/services/api.service";
import type { ApiResponse } from "@/types/api.types";
import type { UserProfile } from "@/types/user.types";
import type { PaginatedResponse } from "@/types/api.types";
import type { Post } from "@/types/post.types";
import type { Blog } from "@/types/blog.types";

export const userService = {
	getProfile: (username: string) =>
		api.get<ApiResponse<UserProfile>>(`/users/profile/${username}`),

	getUserPosts: (username: string, page = 1) =>
		api.get<PaginatedResponse<Post>>("/community/posts", {
			username,
			page,
			per_page: 10,
			sort: "created_at",
			order: "desc",
		}),

	getUserBlogs: (username: string, page = 1) =>
		api.get<PaginatedResponse<Blog>>("/community/blogs", {
			username,
			page,
			per_page: 10,
			sort: "created_at",
			order: "desc",
		}),

	getBookmarks: (page = 1) =>
		api.get<PaginatedResponse<Post>>("/community/posts/bookmarks", {
			page,
			per_page: 10,
		}),

	toggleFollow: (username: string) =>
		api.post<ApiResponse<{ is_following: boolean; followers_count: number }>>(
			`/users/${username}/follow`,
		),

	getFollowers: (username: string) =>
		api.get<ApiResponse<UserProfile[]>>(`/users/${username}/followers`),

	getFollowing: (username: string) =>
		api.get<ApiResponse<UserProfile[]>>(`/users/${username}/following`),
};
