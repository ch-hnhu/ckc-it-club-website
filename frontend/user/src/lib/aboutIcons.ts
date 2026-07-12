// Map tên icon (chuỗi lưu trong config) sang component lucide-react dùng ở
// trang About. Chỉ khai báo những icon thực sự có thể chọn cho các section
// động (Giá trị cốt lõi, Timeline, Các ban). Nếu tên không khớp, dùng fallback.

import {
	BookOpen,
	Heart,
	Trophy,
	Sprout,
	Flag,
	Users,
	Rocket,
	Sparkles,
	Code2,
	Palette,
	Megaphone,
	CalendarDays,
	PenLine,
	Star,
	type LucideIcon,
} from "lucide-react";

export const ABOUT_ICONS: Record<string, LucideIcon> = {
	BookOpen,
	Heart,
	Trophy,
	Sprout,
	Flag,
	Users,
	Rocket,
	Sparkles,
	Code2,
	Palette,
	Megaphone,
	CalendarDays,
	PenLine,
	Star,
};

/** Danh sách tên icon cho phép chọn (dùng cho picker ở admin nếu cần). */
export const ABOUT_ICON_NAMES = Object.keys(ABOUT_ICONS);

/** Trả về component icon theo tên, fallback về Star nếu không khớp. */
export function resolveAboutIcon(name?: string | null): LucideIcon {
	if (name && ABOUT_ICONS[name]) return ABOUT_ICONS[name];
	return Star;
}
