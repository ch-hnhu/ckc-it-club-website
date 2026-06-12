// src/types/gamification.types.ts
// Kiểu dữ liệu Gamification cho giao diện người dùng.

export interface LevelSummary {
	id: number;
	name: string;
	badge: string | null;
	min_points: number;
}

export interface GamificationMe {
	total_points: number;
	level: LevelSummary | null;
	next_level: LevelSummary | null;
	points_to_next_level: number | null;
	progress_percent: number | null;
	week_points: number;
	rank_all_time: number;
	rank_weekly: number;
}

export interface PointHistoryItem {
	id: number;
	points: number;
	rule: string | null;
	rule_key: string | null;
	source_type: string | null;
	source_id: number | null;
	created_at: string;
}

export interface LeaderboardEntry {
	rank: number;
	user_id: number;
	full_name: string;
	username: string | null;
	email: string | null;
	avatar: string | null;
	points: number;
	is_me: boolean;
	level?: LevelSummary | null;
}
