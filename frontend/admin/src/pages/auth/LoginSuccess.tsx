import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

export default function LoginSuccess() {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();

	useEffect(() => {
		const token = searchParams.get("token");
		if (token) {
			localStorage.setItem("access_token", token);
			// Optional: fetch user info right away to verify token
			toast.success("Đăng nhập thành công", { description: "Chào mừng quay trở lại trang quản trị" });
			navigate("/");
		} else {
			toast.error("Đăng nhập thất bại", { description: "Không nhận được token xác thực từ hệ thống" });
			navigate("/login");
		}
	}, [searchParams, navigate]);

	return (
		<div className="flex h-screen w-screen items-center justify-center bg-gray-50">
			<div className="text-center">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
				<p className="text-gray-500">Đang xử lý đăng nhập...</p>
			</div>
		</div>
	);
}
