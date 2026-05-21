import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { authService } from "@/services/auth.service";
import { Loader2 } from "lucide-react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import type { CurrentUser } from "@/types/user.type";

// ─── Inner component (bên trong AuthProvider) ────────────────────────────────

function AuthChecker({ children }: { children: React.ReactNode }) {
	const { user, isLoading, setCurrentUser, setIsLoading } = useAuth();
	const location = useLocation();

	useEffect(() => {
		const checkAuth = async () => {
			const token = localStorage.getItem("access_token");

			if (!token) {
				setIsLoading(false);
				return;
			}

			try {
				const response = await authService.getMe();
				if (response.success) {
					setCurrentUser(response.data as CurrentUser);
				} else {
					localStorage.removeItem("access_token");
					localStorage.removeItem("user");
					setCurrentUser(null);
				}
			} catch {
				localStorage.removeItem("access_token");
				localStorage.removeItem("user");
				setCurrentUser(null);
			} finally {
				setIsLoading(false);
			}
		};

		checkAuth();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	if (isLoading) {
		return (
			<div className="flex h-screen w-screen items-center justify-center bg-gray-50">
				<div className="text-center">
					<Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
					<p className="text-gray-500">Đang kiểm tra xác thực...</p>
				</div>
			</div>
		);
	}

	if (!user) {
		return <Navigate to="/login" state={{ from: location }} replace />;
	}

	return <>{children}</>;
}

// ─── ProtectedRoute — bọc AuthProvider bên ngoài ─────────────────────────────

function ProtectedRoute({ children }: { children: React.ReactNode }) {
	return (
		<AuthProvider>
			<AuthChecker>{children}</AuthChecker>
		</AuthProvider>
	);
}

export default ProtectedRoute;
