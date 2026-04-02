export interface FacultySummary {
	id: number;
	value: string;
	label: string;
	slug: string;
}

export interface Major {
	id: number;
	value: string;
	label: string;
	slug: string;
	faculty_id: number;
	school_classes_count: number;
	created_at: string | null;
	updated_at: string | null;
	faculty?: FacultySummary | null;
}
