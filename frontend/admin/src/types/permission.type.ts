export interface Permission {
	id: number;
	name: string;
	description: string;
	roles: Array<{
		id: number;
		name: string;
		label: string;
	}>;
	created_at: string | null;
}
