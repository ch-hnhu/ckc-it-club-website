export interface UserProfile {
	id: number;
	full_name: string;
	username: string | null;
	email: string;
	avatar: string | null;
	cover_image: string | null;
	bio: string | null;
	student_code: string | null;
	faculty: string | null;
	major: string | null;
	class_name: string | null;
	gender: string | null;
	is_active: boolean;
	posts_count: number;
	followers_count: number;
	following_count: number;
	skills: string[];
	created_at: string;
}
