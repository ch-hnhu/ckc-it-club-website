export const CLUB_INFORMATION_TYPES = [
	{ value: "text", label: "Text" },
	{ value: "html", label: "HTML" },
	{ value: "url", label: "URL" },
	{ value: "image", label: "Image" },
	{ value: "banner", label: "Banner" },
	{ value: "boolean", label: "Boolean" },
] as const;

export type ClubInformationType = (typeof CLUB_INFORMATION_TYPES)[number]["value"];

export interface ClubInformation {
	id: number;
	value: string;
	label: string;
	slug: string;
	type: ClubInformationType | null;
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
	link?: string | null;
	alt?: string | null;
	position?: number | null;
	is_active?: boolean;
	created_at: string;
	updated_at: string;
}
