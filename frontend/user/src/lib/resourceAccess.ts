import type { AuthUser } from "@/services/auth.service";

/**
 * Bản chiếu phía client của ResourceAccessService::canBrowse() ở backend:
 * khu vực tài nguyên dành cho thành viên CLB hoặc sinh viên trường Cao Thắng.
 *
 * Chỉ dùng để dựng giao diện cho đúng — backend vẫn là nơi chặn thật, mọi
 * endpoint tài nguyên đều gọi assertCanBrowse()/assertCanOpen().
 */
export const canBrowseResources = (user: AuthUser | null | undefined): boolean =>
	Boolean(user && (user.is_school_student || user.roles?.some((role) => role !== "user")));
