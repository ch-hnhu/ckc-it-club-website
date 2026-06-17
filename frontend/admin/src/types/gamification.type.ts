// src/types/gamification.type.ts
// Kiểu dữ liệu cho hệ thống Gamification (luật điểm, rank, bảng xếp hạng).

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
	name: string;
	description?: string | null;
	points: number;
	max_per_day?: number | null;
	max_per_week?: number | null;
	is_active?: boolean;
}

export interface Rank {
	id: number;
	name: string;
	min_points: number;
	badge: string | null;
	users_count?: number;
	created_at: string;
	updated_at: string;
}

export interface RankPayload {
	name: string;
	min_points: number;
	badge?: File | null;
}

export interface RankSummary {
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
	member_rank?: RankSummary | null;
}
