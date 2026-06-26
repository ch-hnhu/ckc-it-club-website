export type CourseLevel = "beginner" | "intermediate" | "advanced";
export type CourseStatus = "draft" | "published";
export type CourseAudience = "club_member" | "cao_thang_student" | "public";

export const COURSE_STATUS_MAP: Record<CourseStatus, { label: string; className: string }> = {
	draft: {
		label: "Bản nháp",
		className: "border-amber-500/20 bg-amber-500/10 text-amber-700 hover:bg-amber-500/10",
	},
	published: {
		label: "Đã xuất bản",
		className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10",
	},
};

export const COURSE_LEVEL_MAP: Record<CourseLevel, { label: string; className: string }> = {
	beginner: {
		label: "Cơ bản",
		className: "border-sky-500/20 bg-sky-500/10 text-sky-700 hover:bg-sky-500/10",
	},
	intermediate: {
		label: "Trung cấp",
		className: "border-violet-500/20 bg-violet-500/10 text-violet-700 hover:bg-violet-500/10",
	},
	advanced: {
		label: "Nâng cao",
		className: "border-rose-500/20 bg-rose-500/10 text-rose-700 hover:bg-rose-500/10",
	},
};

export const COURSE_AUDIENCE_MAP: Record<
	CourseAudience,
	{ label: string; className: string; description: string }
> = {
	club_member: {
		label: "Thành viên CLB",
		className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10",
		description: "Chỉ tài khoản thành viên CLB đã đăng nhập mới học được.",
	},
	cao_thang_student: {
		label: "Sinh viên Cao Thắng",
		className: "border-sky-500/20 bg-sky-500/10 text-sky-700 hover:bg-sky-500/10",
		description: "Chỉ tài khoản sinh viên Cao Thắng đã đăng nhập mới học được.",
	},
	public: {
		label: "Công khai",
		className: "border-violet-500/20 bg-violet-500/10 text-violet-700 hover:bg-violet-500/10",
		description: "Mọi tài khoản đã đăng nhập đều học được.",
	},
};
