import type { EventStatus } from "@/pages/event/EventListPage";

export const STATUS_MAP: Record<EventStatus, { label: string; className: string }> = {
	draft: {
		label: "Bản nháp",
		className: "border-amber-500/20 bg-amber-500/10 text-amber-700 hover:bg-amber-500/10",
	},
	published: {
		label: "Đã đăng",
		className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10",
	},
	ongoing: {
		label: "Đang diễn ra",
		className: "border-sky-500/20 bg-sky-500/10 text-sky-700 hover:bg-sky-500/10",
	},
	ended: {
		label: "Đã kết thúc",
		className: "border-slate-500/20 bg-slate-500/10 text-slate-600 hover:bg-slate-500/10",
	},
	cancelled: {
		label: "Đã hủy",
		className: "border-rose-500/20 bg-rose-500/10 text-rose-700 hover:bg-rose-500/10",
	},
};
