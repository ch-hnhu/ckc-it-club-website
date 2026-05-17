export interface ClubInformation {
	id: number;
	value: string;
	label: string;
	slug: string;
	type: string | null;
	description: string | null;
	club_information_values?: Array<ClubInformationValue>;
	is_active?: boolean;
	created_at: string | null;
	updated_at: string | null;
}

export interface ClubInformationValue {
	id: number;
	club_information_id: number;
	value: string;
	is_active?: boolean;
	created_at: string;
	updated_at: string;
}
