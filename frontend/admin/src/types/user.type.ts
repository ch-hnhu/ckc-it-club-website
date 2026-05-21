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

export interface CurrentUser {
	id: number;
	full_name: string;
	email: string;
	avatar: string;
	provider: string;
	email_verified_at: string | null;
	created_at: string;
	roles: Array<{
		name: string;
		label: string;
	}>;
	permissions: string[];
}
