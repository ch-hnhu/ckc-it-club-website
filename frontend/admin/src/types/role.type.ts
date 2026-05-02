export interface Role {
	id: number;
	value: string;
	label: string;
	created_at: string | null;
	total_users?: number;
}
