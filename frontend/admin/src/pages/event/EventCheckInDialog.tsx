import { useCallback, useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { isAxiosError } from "axios";
import { CheckCircle2, Loader2, ScanLine, XCircle } from "lucide-react";

import eventService from "@/services/event.service";
import type { EventRegistrationRecord } from "@/pages/event/EventDetailPage";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

const QR_REGION_ID = "event-check-in-qr-reader";
// Khoảng nghỉ giữa 2 lần đọc cùng một mã — tránh gọi API liên tục khi vé còn trước camera
const SAME_TOKEN_COOLDOWN_MS = 4000;

const timeFormatter = new Intl.DateTimeFormat("vi-VN", {
	hour: "2-digit",
	minute: "2-digit",
	second: "2-digit",
});

type ScanResult =
	| { type: "success"; registration: EventRegistrationRecord; at: Date }
	| { type: "error"; message: string; at: Date };

// Tách riêng để effect khởi tạo camera chỉ chạy sau khi div của scanner
// đã được mount bên trong DialogContent (Radix render qua portal)
function QrScannerRegion({ onDecoded }: { onDecoded: (token: string) => void }) {
	const [cameraError, setCameraError] = useState<string | null>(null);

	useEffect(() => {
		const scanner = new Html5Qrcode(QR_REGION_ID);

		scanner
			.start(
				{ facingMode: "environment" },
				{ fps: 10, qrbox: { width: 220, height: 220 } },
				(decodedText) => onDecoded(decodedText),
				undefined,
			)
			.catch(() => {
				setCameraError(
					"Không thể truy cập camera. Hãy kiểm tra quyền truy cập camera của trình duyệt.",
				);
			});

		return () => {
			if (scanner.isScanning) {
				scanner
					.stop()
					.then(() => scanner.clear())
					.catch(() => {});
			} else {
				scanner.clear();
			}
		};
	}, [onDecoded]);

	return (
		<div className='overflow-hidden rounded-lg border bg-black'>
			<div id={QR_REGION_ID} className='[&_video]:!w-full' />
			{cameraError ? (
				<div className='flex h-40 items-center justify-center p-4'>
					<p className='text-center text-sm text-white/80'>{cameraError}</p>
				</div>
			) : null}
		</div>
	);
}

interface EventCheckInDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	eventId: number | string;
	onCheckedIn: () => void;
}

function EventCheckInDialog({ open, onOpenChange, eventId, onCheckedIn }: EventCheckInDialogProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [lastResult, setLastResult] = useState<ScanResult | null>(null);
	const [checkedInCount, setCheckedInCount] = useState(0);

	const busyRef = useRef(false);
	const lastTokenRef = useRef<{ token: string; at: number } | null>(null);

	const handleDecoded = useCallback(
		async (token: string) => {
			if (busyRef.current) return;

			const last = lastTokenRef.current;
			if (last && last.token === token && Date.now() - last.at < SAME_TOKEN_COOLDOWN_MS) {
				return;
			}

			busyRef.current = true;
			lastTokenRef.current = { token, at: Date.now() };
			setIsSubmitting(true);

			try {
				const response = await eventService.checkIn(eventId, { qr_token: token });
				setLastResult({ type: "success", registration: response.data, at: new Date() });
				setCheckedInCount((prev) => prev + 1);
				onCheckedIn();
			} catch (error) {
				const message =
					isAxiosError(error) && error.response?.data?.message
						? String(error.response.data.message)
						: "Không thể điểm danh. Vui lòng thử lại.";
				setLastResult({ type: "error", message, at: new Date() });
			} finally {
				busyRef.current = false;
				setIsSubmitting(false);
			}
		},
		[eventId, onCheckedIn],
	);

	useEffect(() => {
		if (!open) return;

		setLastResult(null);
		setCheckedInCount(0);
		lastTokenRef.current = null;
	}, [open]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='sm:max-w-[440px]'>
				<DialogHeader>
					<DialogTitle className='flex items-center gap-2'>
						<ScanLine className='h-5 w-5' />
						Điểm danh bằng mã QR
					</DialogTitle>
					<DialogDescription>
						Đưa mã QR trên vé của người tham gia vào khung hình để điểm danh.
					</DialogDescription>
				</DialogHeader>

				<div className='flex flex-col gap-3'>
					<QrScannerRegion onDecoded={handleDecoded} />

					<div className='flex items-center justify-between text-sm text-muted-foreground'>
						<span>Đã điểm danh trong phiên này: {checkedInCount}</span>
						{isSubmitting ? (
							<span className='flex items-center gap-1.5'>
								<Loader2 className='h-3.5 w-3.5 animate-spin' />
								Đang xử lý...
							</span>
						) : null}
					</div>

					{lastResult?.type === "success" ? (
						<div className='flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3'>
							<CheckCircle2 className='h-5 w-5 shrink-0 text-emerald-600' />
							<Avatar className='h-9 w-9'>
								<AvatarImage src={lastResult.registration.user?.avatar ?? undefined} />
								<AvatarFallback>
									{(lastResult.registration.user?.full_name ?? "?").charAt(0).toUpperCase()}
								</AvatarFallback>
							</Avatar>
							<div className='min-w-0 flex-1'>
								<p className='truncate text-sm font-medium'>
									{lastResult.registration.user?.full_name ?? "Ẩn danh"}
								</p>
								<p className='truncate text-xs text-muted-foreground'>
									{lastResult.registration.user?.email}
								</p>
							</div>
							<Badge variant='outline' className='shrink-0 border-emerald-500/30 bg-emerald-500/10 text-emerald-700'>
								{timeFormatter.format(lastResult.at)}
							</Badge>
						</div>
					) : null}

					{lastResult?.type === "error" ? (
						<div className='flex items-center gap-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3'>
							<XCircle className='h-5 w-5 shrink-0 text-rose-600' />
							<p className='min-w-0 flex-1 text-sm text-rose-700'>{lastResult.message}</p>
							<Badge variant='outline' className='shrink-0 border-rose-500/30 bg-rose-500/10 text-rose-700'>
								{timeFormatter.format(lastResult.at)}
							</Badge>
						</div>
					) : null}
				</div>
			</DialogContent>
		</Dialog>
	);
}

export default EventCheckInDialog;
