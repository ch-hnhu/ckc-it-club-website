export interface User {
	id: number;
	full_name: string;
	roles: Array<{
		id: number;
		name: string;
		label: string;
	}>;
	gender?: string | null;
	email: string;
	is_active: boolean;
	avatar: string;
	created_at: string;
	updated_at: string;
}
