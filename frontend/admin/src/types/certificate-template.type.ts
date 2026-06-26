/** Người tạo mẫu chứng chỉ (rút gọn). */
export interface CertificateTemplateCreator {
	id: number;
	full_name: string | null;
	avatar: string | null;
}

// ─── Thiết kế canvas (scene JSON dùng chung editor ↔ renderer) ────────────────

export type CertificateElementType = "text" | "image" | "rect" | "line" | "ellipse" | "qr";

/** Một phần tử trên canvas. Các field tuỳ `type` (xem editor để biết field nào áp dụng). */
export interface CertificateElement {
	id: string;
	type: CertificateElementType;
	x: number;
	y: number;
	width: number;
	height: number;
	rotation?: number;
	// text
	text?: string;
	fontFamily?: string;
	fontSize?: number;
	fontStyle?: string; // "normal" | "bold" | "italic" | "italic bold"
	align?: "left" | "center" | "right";
	// chung cho shape/text
	fill?: string;
	// shape (rect/line/ellipse) + viền
	stroke?: string;
	strokeWidth?: number;
	cornerRadius?: number;
	// image
	src?: string;
}

export interface CertificateCanvas {
	width: number;
	height: number;
	background: { color: string; image: string | null };
}

/** Toàn bộ thiết kế của một mẫu. */
export interface CertificateDesign {
	canvas: CertificateCanvas;
	elements: CertificateElement[];
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

/** Chi tiết mẫu (kèm thiết kế) cho editor. */
export interface CertificateTemplateDetail extends CertificateTemplate {
	design: CertificateDesign | null;
}

/** Payload lưu mẫu từ editor. */
export interface CertificateTemplatePayload {
	name: string;
	design: CertificateDesign;
	thumbnail?: string | null; // data URL PNG từ stage.toDataURL()
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
