export interface Department {
	id: number;
	name: string;
	slug: string;
	description: string | null;
	is_active: boolean;
	head_role: {
		id: number;
		name: string;
		label: string;
	} | null;
	users_count: number;
	created_at: string | null;
	updated_at: string | null;
}

export interface DepartmentUser {
	id: number;
	full_name: string;
	email: string;
	avatar: string | null;
	is_active: boolean;
	department_role: {
		id: number | null;
		name: string | null;
		label: string | null;
	};
	is_head: boolean;
	position?: string | null;
	joined_at: string | null;
}

export interface DepartmentDetail extends Department {
	users: DepartmentUser[];
}
