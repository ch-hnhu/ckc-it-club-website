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
