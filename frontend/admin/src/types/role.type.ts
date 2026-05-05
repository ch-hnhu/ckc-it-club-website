export interface Role {
	id: number;
	value: string;
	label: string;
	is_system: boolean;
	created_at: string | null;
	total_users?: number;
}
