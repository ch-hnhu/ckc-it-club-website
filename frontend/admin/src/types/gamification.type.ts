// src/types/gamification.type.ts
// Kiểu dữ liệu cho hệ thống Gamification (luật điểm, cấp độ, bảng xếp hạng).

export interface PointRule {
	id: number;
	key: string;
	name: string;
	description: string | null;
	points: number;
	max_per_day: number | null;
	max_per_week: number | null;
	is_active: boolean;
	transactions_count?: number;
	created_at: string;
	updated_at: string;
}

export interface PointRulePayload {
	key: string;
	name: string;
	description?: string | null;
	points: number;
	max_per_day?: number | null;
	max_per_week?: number | null;
	is_active?: boolean;
}

export interface Level {
	id: number;
	name: string;
	min_points: number;
	badge: string | null;
	users_count?: number;
	created_at: string;
	updated_at: string;
}

export interface LevelPayload {
	name: string;
	min_points: number;
	badge?: File | null;
}

export interface LevelSummary {
	id: number;
	name: string;
	badge: string | null;
	min_points: number;
}

export interface LeaderboardEntry {
	rank: number;
	user_id: number;
	full_name: string;
	avatar: string | null;
	points: number;
	is_me: boolean;
	level?: LevelSummary | null;
}
