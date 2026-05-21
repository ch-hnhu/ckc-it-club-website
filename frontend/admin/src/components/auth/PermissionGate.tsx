import { useAuth } from "@/contexts/AuthContext";

interface PermissionGateProps {
	permission: string;
	children: React.ReactNode;
	fallback?: React.ReactNode;
}

/**
 * Hiện `children` chỉ khi user có permission tương ứng.
 *
 * @example
 * <PermissionGate permission="users.create">
 *   <Button>Thêm người dùng</Button>
 * </PermissionGate>
 */
export function PermissionGate({ permission, children, fallback = null }: PermissionGateProps) {
	const { hasPermission } = useAuth();
	return hasPermission(permission) ? <>{children}</> : <>{fallback}</>;
}
