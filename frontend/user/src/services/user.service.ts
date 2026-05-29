import { api } from "@/services/api.service";
import type { ApiResponse } from "@/types/api.types";
import type { UserProfile } from "@/types/user.types";
import type { PaginatedResponse } from "@/types/api.types";
import type { Post } from "@/types/post.types";

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
};
