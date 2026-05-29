import { useRouteError, isRouteErrorResponse, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Home, RefreshCw, Zap } from "lucide-react";

export default function ErrorPage() {
	const error = useRouteError();
	const navigate = useNavigate();

	// catch-all "*" route has no error; treat as 404
	const isNotFound = !error || (isRouteErrorResponse(error) && error.status === 404);
	const isRuntimeError = !!error && !isRouteErrorResponse(error);

	const code = isNotFound ? "404" : isRouteErrorResponse(error) ? String(error.status) : "Lỗi";
	const title = isNotFound ? "Trang không tồn tại" : "Có lỗi xảy ra";
	const subtitle = isNotFound
		? "Trang bạn tìm kiếm đã bị xóa, đổi địa chỉ hoặc chưa từng tồn tại."
		: "Ứng dụng gặp sự cố không mong muốn. Hãy thử tải lại trang.";

	return (
		<div className="min-h-screen bg-[var(--color-surface,#f5f5f0)] flex items-center justify-center p-6">
			{/* Decorative background dots */}
			<div
				className="pointer-events-none fixed inset-0 opacity-[0.04]"
				style={{
					backgroundImage: "radial-gradient(circle, #111 1.5px, transparent 1.5px)",
					backgroundSize: "28px 28px",
				}}
			/>

			<div className="relative w-full max-w-lg">
				{/* Big offset card shadow */}
				<div className="absolute inset-0 translate-x-3 translate-y-3 rounded-2xl border-2 border-black bg-black" />

				<div className="relative rounded-2xl border-2 border-black bg-white p-8 md:p-12">
					{/* Top badge */}
					<div className="mb-6 inline-flex items-center gap-2 rounded-full border-2 border-black bg-[var(--color-primary)] px-3 py-1 text-xs font-extrabold text-black shadow-[2px_2px_0_#111]">
						<Zap className="h-3.5 w-3.5 fill-current" />
						CKC IT CLUB
					</div>

					{/* Error code */}
					<div className="relative mb-2 select-none">
						<span
							className="absolute top-1 left-1 font-heading text-8xl font-extrabold text-black/10 md:text-9xl"
							aria-hidden="true">
							{code}
						</span>
						<span className="relative font-heading text-8xl font-extrabold text-black md:text-9xl">
							{code}
						</span>
					</div>

					{/* Title */}
					<h1 className="mt-4 font-heading text-2xl font-extrabold leading-tight text-black md:text-3xl">
						{title}
					</h1>

					{/* Subtitle */}
					<p className="mt-3 text-base leading-7 text-gray-600">{subtitle}</p>

					{/* Divider */}
					<div className="my-6 border-t-2 border-dashed border-black/20" />

					{/* Actions */}
					<div className="flex flex-wrap gap-3">
						<Link
							to="/"
							className="inline-flex h-11 items-center gap-2 rounded-xl border-2 border-black bg-[var(--color-primary)] px-5 font-heading text-sm font-extrabold text-black shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none">
							<Home className="h-4 w-4" />
							Về trang chủ
						</Link>

						<button
							onClick={() => navigate(-1)}
							className="inline-flex h-11 items-center gap-2 rounded-xl border-2 border-black bg-white px-5 font-heading text-sm font-extrabold text-black shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none">
							<ArrowLeft className="h-4 w-4" />
							Quay lại
						</button>

						{isRuntimeError && (
							<button
								onClick={() => window.location.reload()}
								className="inline-flex h-11 items-center gap-2 rounded-xl border-2 border-black bg-white px-5 font-heading text-sm font-extrabold text-black shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none">
								<RefreshCw className="h-4 w-4" />
								Tải lại
							</button>
						)}
					</div>

					{/* Quick links */}
					<div className="mt-6 flex flex-wrap gap-x-4 gap-y-1 text-sm">
						<Link
							to="/cong-dong"
							className="font-bold text-lime-700 transition hover:text-black hover:underline">
							Cộng đồng
						</Link>
						<Link
							to="/blog"
							className="font-bold text-lime-700 transition hover:text-black hover:underline">
							Blog
						</Link>
						<Link
							to="/lien-he"
							className="font-bold text-lime-700 transition hover:text-black hover:underline">
							Liên hệ
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}
