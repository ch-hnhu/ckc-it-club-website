import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import type { NavigateOptions, To } from "react-router-dom";
import { toast } from "sonner";

import { ACCESS_DENIED_MESSAGE } from "@/constants/auth";
import { getRequiredPermissionForPath } from "@/config/navigation";
import { useAuth } from "@/contexts/AuthContext";

function getPathnameFromTo(to: To): string {
	if (typeof to === "string") {
		return new URL(to, window.location.origin).pathname;
	}

	return to.pathname ?? window.location.pathname;
}

export function usePermissionNavigationGuard() {
	const { hasPermission, isLoading } = useAuth();

	return useCallback(
		(to: To | number) => {
			if (typeof to === "number" || isLoading) return true;

			const requiredPermission = getRequiredPermissionForPath(getPathnameFromTo(to));
			if (!requiredPermission || hasPermission(requiredPermission)) return true;

			toast.error(ACCESS_DENIED_MESSAGE, {
				id: "navigation-permission-denied",
				position: "top-right",
			});

			return false;
		},
		[hasPermission, isLoading],
	);
}

export function useGuardedNavigate() {
	const navigate = useNavigate();
	const canNavigate = usePermissionNavigationGuard();

	return useCallback(
		(to: To | number, options?: NavigateOptions) => {
			if (!canNavigate(to)) return;

			if (typeof to === "number") {
				navigate(to);
				return;
			}

			navigate(to, options);
		},
		[canNavigate, navigate],
	);
}
