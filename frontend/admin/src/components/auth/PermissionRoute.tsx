import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface PermissionRouteProps {
	permission: string;
	children: React.ReactNode;
	redirectTo?: string;
}

/**
 * Guard route-level: redirect về `redirectTo` nếu user không có permission.
 *
 * @example
 * <PermissionRoute permission="users.view">
 *   <UserList />
 * </PermissionRoute>
 */
export function PermissionRoute({ permission, children, redirectTo = "/" }: PermissionRouteProps) {
	const { hasPermission, isLoading } = useAuth();

	if (isLoading) return null;

	if (!hasPermission(permission)) {
		return <Navigate to={redirectTo} replace />;
	}

	return <>{children}</>;
}
