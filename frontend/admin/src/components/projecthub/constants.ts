import type { ProjectMemberRole, ProjectVisibility, TaskPriority } from "@/types/projecthub.types";

export const PRIORITY_META: Record<
	TaskPriority,
	{ label: string; className: string; dot: string }
> = {
	low: { label: "Thấp", className: "bg-gray-100 text-gray-700", dot: "bg-gray-400" },
	medium: { label: "Trung bình", className: "bg-sky-100 text-sky-800", dot: "bg-sky-500" },
	high: { label: "Cao", className: "bg-amber-100 text-amber-800", dot: "bg-amber-500" },
	urgent: { label: "Khẩn cấp", className: "bg-red-100 text-red-800", dot: "bg-red-500" },
};

export const PRIORITY_ORDER: TaskPriority[] = ["low", "medium", "high", "urgent"];

export const MEMBER_ROLE_META: Record<ProjectMemberRole, { label: string; className: string }> = {
	owner: { label: "Chủ sở hữu", className: "bg-primary/15 text-primary" },
	editor: { label: "Biên tập", className: "bg-sky-100 text-sky-800" },
	viewer: { label: "Người xem", className: "bg-gray-100 text-gray-700" },
};

export const MEMBER_ROLE_ORDER: ProjectMemberRole[] = ["owner", "editor", "viewer"];

export const VISIBILITY_META: Record<ProjectVisibility, { label: string }> = {
	private: { label: "Riêng tư" },
	members: { label: "Thành viên" },
	public: { label: "Công khai" },
};

// Bảng màu gợi ý cho board.
export const BOARD_COLORS = [
	"#6366f1",
	"#38bdf8",
	"#f472b6",
	"#fbbf24",
	"#c084fc",
	"#fb7185",
	"#34d399",
	"#94a3b8",
];

/** Viết tắt tên cho avatar fallback. */
export function initials(name: string | null | undefined): string {
	const n = (name || "?").trim().split(/\s+/);
	if (n.length === 1) return n[0].slice(0, 2).toUpperCase();
	return (n[0][0] + n[n.length - 1][0]).toUpperCase();
}

/** ISO date -> "YYYY-MM-DD" cho input[type=date]. */
export function toDateInput(iso: string | null | undefined): string {
	return iso ? iso.slice(0, 10) : "";
}

/** "YYYY-MM-DD" -> "DD/MM" hiển thị gọn trên thẻ. */
export function formatShortDate(iso: string | null | undefined): string {
	if (!iso) return "";
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return "";
	return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Quá hạn khi due_date < hôm nay và task chưa hoàn thành. */
export function isOverdue(dueDate: string | null, completedAt: string | null): boolean {
	if (!dueDate || completedAt) return false;
	const due = new Date(dueDate.slice(0, 10));
	const today = new Date(new Date().toISOString().slice(0, 10));
	return due.getTime() < today.getTime();
}
