export type ResourceLinkType = "google_drive" | "youtube" | "github" | "document" | "other";
export type ResourceStatus = "pending_review" | "published" | "rejected" | "hidden";
export type ResourceReportReason = "inappropriate" | "broken_link" | "copyright" | "other";

export interface ResourceUploader {
	id: number;
	full_name: string | null;
	avatar: string | null;
	username: string | null;
}

export interface Resource {
	id: number;
	uploader: ResourceUploader | null;
	title: string;
	description: string | null;
	link_type: ResourceLinkType;
	url: string;
	status: ResourceStatus;
	click_count: number;
	created_at: string;
}

export interface CreateResourcePayload {
	title: string;
	description?: string;
	link_type: ResourceLinkType;
	url: string;
}
