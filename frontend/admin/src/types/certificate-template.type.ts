/** Người tạo mẫu chứng chỉ (rút gọn). */
export interface CertificateTemplateCreator {
	id: number;
	full_name: string | null;
	avatar: string | null;
}

/** Một mẫu chứng chỉ trong trang quản trị "Trung tâm đào tạo". */
export interface CertificateTemplate {
	id: number;
	name: string;
	thumbnail: string | null;
	is_default: boolean;
	creator: CertificateTemplateCreator | null;
	created_at: string | null;
	updated_at: string | null;
}

/** Các cột có thể sắp xếp trên bảng mẫu chứng chỉ. */
export type CertificateTemplateSortKey = "id" | "name" | "is_default" | "created_at" | "creator";

/** Tham số truy vấn danh sách mẫu chứng chỉ. */
export interface CertificateTemplateListParams {
	page?: number;
	per_page?: number;
	search?: string;
	sort?: CertificateTemplateSortKey | null;
	order?: "asc" | "desc" | null;
}
