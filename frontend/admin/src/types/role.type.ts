export interface Role {
	id: number;
	value: string;
	label: string;
	is_system: boolean;
	created_at: string | null;
	total_users?: number;
}

export type RoleEnum =
	| "admin"
	| "president"
	| "vice-president"
	| "academic-head"
	| "communications-head"
	| "volunteer-head"
	| "club-member"
	| "user";
