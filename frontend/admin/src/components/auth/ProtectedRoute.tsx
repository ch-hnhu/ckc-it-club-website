import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { authService } from "@/services/auth.service";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
	children: React.ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
	const [isLoading, setIsLoading] = useState(true);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const location = useLocation();

	useEffect(() => {
		const checkAuth = async () => {
			const token = localStorage.getItem("access_token");
			
			if (!token) {
				setIsLoading(false);
				return;
			}

			try {
				// Verify token with backend
				const response = await authService.getMe();
				setIsAuthenticated(response.success);
			} catch (error) {
				console.error("Auth check failed:", error);
				// Clear invalid token
				localStorage.removeItem("access_token");
				localStorage.removeItem("user");
				setIsAuthenticated(false);
			} finally {
				setIsLoading(false);
			}
		};

		checkAuth();
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

	if (!isAuthenticated) {
		// Redirect to login with return url
		return <Navigate to="/login" state={{ from: location }} replace />;
	}

	return <>{children}</>;
}

export default ProtectedRoute;
