export interface AcademicStructureImportError {
	row: number;
	message: string;
}

export interface AcademicStructureImportSummary {
	processed_rows: number;
	created: {
		faculties: number;
		majors: number;
		school_classes: number;
	};
	existing: {
		faculties: number;
		majors: number;
		school_classes: number;
	};
	errors: AcademicStructureImportError[];
}

export type AcademicStructureImportStatus = "completed" | "failed";
export type AcademicStructureImportFileType = "Excel" | "CSV" | "ZIP" | "Other";

export interface AcademicStructureImportRecord {
	id: number;
	file_name: string;
	file_type: AcademicStructureImportFileType;
	file_size_bytes: number;
	uploaded_by_name: string;
	uploaded_at: string | null;
	status: AcademicStructureImportStatus;
	description: string;
	processed_rows: number;
	errors_count: number;
	error_message: string | null;
	created_faculties: number;
	created_majors: number;
	created_school_classes: number;
	existing_faculties: number;
	existing_majors: number;
	existing_school_classes: number;
	error_details: AcademicStructureImportError[] | null;
}

export interface AcademicStructureImportStats {
	total: number;
	completed: number;
	failed: number;
	with_errors: number;
	total_size_bytes: number;
}
