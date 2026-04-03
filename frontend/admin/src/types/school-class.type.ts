import type { FacultySummary, Major } from "@/types/major.type";

export interface SchoolClass {
	id: number;
	value: string;
	label: string;
	slug: string;
	major_id: number;
	created_at: string | null;
	updated_at: string | null;
	major?: (Major & { faculty?: FacultySummary | null }) | null;
}
