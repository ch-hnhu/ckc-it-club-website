import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { ACCESS_DENIED_MESSAGE } from "@/constants/auth";
import { useAuth } from "@/contexts/AuthContext";
import { getFirstAuthorizedNavPath } from "@/config/navigation";

interface PermissionRouteProps {
	permission: string;
	children: React.ReactNode;
	redirectTo?: string;
}

const LAST_AUTHORIZED_PATH_KEY = "admin:lastAuthorizedPath";

function getFullPath(location: ReturnType<typeof useLocation>) {
	return `${location.pathname}${location.search}${location.hash}`;
}

/**
 * Guard route-level: toast nếu user không có permission và quay lại route hợp lệ gần nhất.
 *
 * @example
 * <PermissionRoute permission="users.view">
 *   <UserList />
 * </PermissionRoute>
 */
export function PermissionRoute({ permission, children, redirectTo }: PermissionRouteProps) {
	const { hasPermission, isLoading, user } = useAuth();
	const location = useLocation();
	const navigate = useNavigate();
	const currentPath = getFullPath(location);
	const canAccess = hasPermission(permission);

	useEffect(() => {
		if (isLoading || !canAccess) return;
		sessionStorage.setItem(LAST_AUTHORIZED_PATH_KEY, currentPath);
	}, [canAccess, currentPath, isLoading]);

	useEffect(() => {
		if (isLoading || canAccess) return;

		toast.error(ACCESS_DENIED_MESSAGE, {
			id: "route-permission-denied",
			position: "top-right",
		});

		const lastAuthorizedPath = sessionStorage.getItem(LAST_AUTHORIZED_PATH_KEY);
		const firstAuthorizedPath = getFirstAuthorizedNavPath(user?.permissions ?? []);
		const fallbackPath = [redirectTo, lastAuthorizedPath, firstAuthorizedPath].find(
			(path) => path && path !== currentPath,
		);

		if (fallbackPath) {
			navigate(fallbackPath, { replace: true });
		}
	}, [canAccess, currentPath, isLoading, navigate, redirectTo, user?.permissions]);

	if (isLoading) return null;

	if (!canAccess) return null;

	return <>{children}</>;
}
