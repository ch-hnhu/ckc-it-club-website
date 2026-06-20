import { useCallback, useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { CheckCircle2, Loader2, ScanLine, XCircle } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import type { CourseLessonRow } from "@/pages/learning/course-detail-mock";

// UI-first mock: tái dùng đúng pattern QR của Event (EventCheckInDialog).
// Khi có backend, thay handleDecoded bằng lessonService.checkIn(lessonId, { qr_token }).

const QR_REGION_ID_PREFIX = "lesson-check-in-qr-reader";
const SAME_TOKEN_COOLDOWN_MS = 4000;

const timeFormatter = new Intl.DateTimeFormat("vi-VN", {
	hour: "2-digit",
	minute: "2-digit",
	second: "2-digit",
});

export interface CheckInStudent {
	id: number;
	full_name: string;
	email: string;
	avatar: string | null;
}

type ScanResult =
	| { type: "success"; student: CheckInStudent; at: Date }
	| { type: "error"; message: string; at: Date };

// Tách riêng để effect khởi tạo camera chỉ chạy sau khi div của scanner
// đã được mount bên trong DialogContent (Radix render qua portal)
function QrScannerRegion({ onDecoded }: { onDecoded: (token: string) => void }) {
	const [cameraError, setCameraError] = useState<string | null>(null);
	const wrapperRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		const wrapper = wrapperRef.current;
		if (!wrapper) return;

		const region = document.createElement("div");
		region.id = `${QR_REGION_ID_PREFIX}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
		wrapper.replaceChildren(region);

		const scanner = new Html5Qrcode(region.id);
		let isDisposed = false;
		let hasStarted = false;

		const clearScanner = () => {
			try {
				scanner.clear();
			} catch {
				// instance có thể đã bị clear trong StrictMode cleanup
			}
		};

		const removeRegion = () => {
			if (region.parentElement === wrapper) {
				region.remove();
			}
		};

		const stopScanner = () => {
			if (scanner.isScanning || hasStarted) {
				void scanner
					.stop()
					.catch(() => {})
					.finally(() => {
						clearScanner();
						removeRegion();
					});
				return;
			}

			clearScanner();
			removeRegion();
		};

		scanner
			.start(
				{ facingMode: "environment" },
				{ fps: 10, qrbox: { width: 220, height: 220 } },
				(decodedText) => onDecoded(decodedText),
				undefined,
			)
			.then(() => {
				hasStarted = true;
				if (isDisposed) {
					stopScanner();
				}
			})
			.catch(() => {
				if (isDisposed) return;
				setCameraError(
					"Không thể truy cập camera. Hãy kiểm tra quyền truy cập camera của trình duyệt.",
				);
			});

		return () => {
			isDisposed = true;
			stopScanner();
		};
	}, [onDecoded]);

	return (
		<div className='overflow-hidden rounded-lg border bg-black'>
			<div
				ref={wrapperRef}
				className='max-w-full [&_*]:max-w-full [&_video]:!h-auto [&_video]:max-h-[42vh] [&_video]:!w-full [&_video]:object-cover'
			/>
			{cameraError ? (
				<div className='flex h-40 items-center justify-center p-4'>
					<p className='text-center text-sm text-white/80'>{cameraError}</p>
				</div>
			) : null}
		</div>
	);
}

interface LessonCheckInDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	lesson: CourseLessonRow | null;
	/** Danh sách học viên track offline của khóa */
	students: CheckInStudent[];
	/** Gọi mỗi khi điểm danh thành công một học viên cho buổi này */
	onCheckedIn: (lessonId: number, student: CheckInStudent) => void;
}

function LessonCheckInDialog({
	open,
	onOpenChange,
	lesson,
	students,
	onCheckedIn,
}: LessonCheckInDialogProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [lastResult, setLastResult] = useState<ScanResult | null>(null);
	const [sessionCount, setSessionCount] = useState(0);

	const busyRef = useRef(false);
	const lastTokenRef = useRef<{ token: string; at: number } | null>(null);
	// Con trỏ mock: bắt đầu từ số đã điểm danh sẵn của buổi, mỗi lần quét tiến 1 học viên
	const cursorRef = useRef(0);

	useEffect(() => {
		if (!open) return;
		setLastResult(null);
		setSessionCount(0);
		lastTokenRef.current = null;
		cursorRef.current = lesson?.attendances_count ?? 0;
	}, [open, lesson]);

	const handleDecoded = useCallback(
		async (token: string) => {
			if (busyRef.current || !lesson) return;

			const last = lastTokenRef.current;
			if (last && last.token === token && Date.now() - last.at < SAME_TOKEN_COOLDOWN_MS) {
				return;
			}

			busyRef.current = true;
			lastTokenRef.current = { token, at: Date.now() };
			setIsSubmitting(true);

			// Giả lập gọi API điểm danh
			await new Promise((r) => setTimeout(r, 400));

			const next = students[cursorRef.current];
			if (!next) {
				setLastResult({
					type: "error",
					message: "Tất cả học viên offline đã được điểm danh cho buổi này.",
					at: new Date(),
				});
			} else {
				cursorRef.current += 1;
				setSessionCount((c) => c + 1);
				setLastResult({ type: "success", student: next, at: new Date() });
				onCheckedIn(lesson.id, next);
			}

			busyRef.current = false;
			setIsSubmitting(false);
		},
		[lesson, students, onCheckedIn],
	);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-[440px]'>
				<DialogHeader>
					<DialogTitle className='flex items-center gap-2'>
						<ScanLine className='h-5 w-5' />
						Điểm danh buổi học
					</DialogTitle>
					<DialogDescription>
						{lesson
							? `Buổi ${lesson.order}: ${lesson.title}. Đưa mã QR trên vé của học viên vào khung hình để điểm danh.`
							: "Đưa mã QR vào khung hình để điểm danh."}
					</DialogDescription>
				</DialogHeader>

				<div className='flex flex-col gap-3'>
					{open ? <QrScannerRegion onDecoded={handleDecoded} /> : null}

					<div className='flex items-center justify-between text-sm text-muted-foreground'>
						<span>Đã điểm danh trong phiên này: {sessionCount}</span>
						{isSubmitting ? (
							<span className='flex items-center gap-1.5'>
								<Loader2 className='h-3.5 w-3.5 animate-spin' />
								Đang xử lý...
							</span>
						) : null}
					</div>

					{lastResult?.type === "success" ? (
						<div className='flex min-w-0 flex-col gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 sm:flex-row sm:items-center'>
							<div className='flex min-w-0 flex-1 items-center gap-3'>
								<CheckCircle2 className='h-5 w-5 shrink-0 text-emerald-600' />
								<Avatar className='h-9 w-9 shrink-0'>
									<AvatarImage src={lastResult.student.avatar ?? undefined} />
									<AvatarFallback>
										{lastResult.student.full_name.charAt(0).toUpperCase()}
									</AvatarFallback>
								</Avatar>
								<div className='min-w-0 flex-1'>
									<p className='truncate text-sm font-medium'>
										{lastResult.student.full_name}
									</p>
									<p className='truncate text-xs text-muted-foreground'>
										{lastResult.student.email}
									</p>
								</div>
							</div>
							<Badge
								variant='outline'
								className='w-fit shrink-0 border-emerald-500/30 bg-emerald-500/10 text-emerald-700 sm:ml-auto'>
								{timeFormatter.format(lastResult.at)}
							</Badge>
						</div>
					) : null}

					{lastResult?.type === "error" ? (
						<div className='flex min-w-0 flex-col gap-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 sm:flex-row sm:items-center'>
							<div className='flex min-w-0 flex-1 items-center gap-3'>
								<XCircle className='h-5 w-5 shrink-0 text-rose-600' />
								<p className='min-w-0 flex-1 break-words text-sm text-rose-700'>
									{lastResult.message}
								</p>
							</div>
							<Badge
								variant='outline'
								className='w-fit shrink-0 border-rose-500/30 bg-rose-500/10 text-rose-700 sm:ml-auto'>
								{timeFormatter.format(lastResult.at)}
							</Badge>
						</div>
					) : null}
				</div>
			</DialogContent>
		</Dialog>
	);
}

export default LessonCheckInDialog;
