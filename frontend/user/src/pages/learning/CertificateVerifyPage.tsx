import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
	Award,
	BadgeCheck,
	CalendarDays,
	ExternalLink,
	Loader2,
	ShieldAlert,
	ShieldX,
} from "lucide-react";
import { learningService } from "@/services/learning.service";
import type { CertificateVerifyResult } from "@/types/learning.types";

const dtf = new Intl.DateTimeFormat("vi-VN", { dateStyle: "long" });

function formatDate(value: string | null) {
	if (!value) return "--";
	const d = new Date(value);
	return Number.isNaN(d.getTime()) ? "--" : dtf.format(d);
}

const CertificateVerifyPage: React.FC = () => {
	const { code } = useParams<{ code: string }>();

	const [result, setResult] = useState<CertificateVerifyResult | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);

	useEffect(() => {
		if (!code) return;

		let cancelled = false;
		setLoading(true);
		setError(false);

		learningService
			.verifyCertificate(code)
			.then((res) => {
				if (!cancelled) setResult(res.data);
			})
			.catch(() => {
				if (!cancelled) setError(true);
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [code]);

	return (
		<div className='mx-auto w-full max-w-2xl px-4 pb-16 pt-24 md:pt-28'>
			<div className='mb-6 text-center'>
				<div className='mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl border-2 border-black bg-[var(--color-primary,#a3e635)] shadow-[3px_3px_0_#111]'>
					<Award className='h-6 w-6 text-black' />
				</div>
				<h1 className='font-heading text-2xl font-extrabold text-black md:text-3xl'>
					Xác minh chứng chỉ
				</h1>
				<p className='mt-1 text-sm text-gray-600'>
					Kiểm tra tính xác thực của chứng chỉ do CKC IT CLUB cấp.
				</p>
			</div>

			{loading ? (
				<div className='flex min-h-[30vh] items-center justify-center'>
					<Loader2 className='h-8 w-8 animate-spin text-gray-400' />
				</div>
			) : error ? (
				<StatusCard
					tone='neutral'
					icon={<ShieldAlert className='h-8 w-8' />}
					title='Không thể kiểm tra'
					message='Đã có lỗi khi kết nối máy chủ. Vui lòng thử lại sau.'
					code={code}
				/>
			) : result?.status === "valid" && result.certificate ? (
				<ValidCard result={result} />
			) : result?.status === "revoked" && result.certificate ? (
				<StatusCard
					tone='danger'
					icon={<ShieldX className='h-8 w-8' />}
					title='Chứng chỉ đã bị thu hồi'
					message={`Chứng chỉ này đã bị thu hồi vào ${formatDate(result.certificate.revoked_at)} và không còn hiệu lực.`}
					code={result.certificate.cert_code}
				/>
			) : (
				<StatusCard
					tone='neutral'
					icon={<ShieldAlert className='h-8 w-8' />}
					title='Không tìm thấy chứng chỉ'
					message='Không có chứng chỉ nào ứng với mã này. Hãy kiểm tra lại mã trên chứng chỉ.'
					code={code}
				/>
			)}
		</div>
	);
};

function ValidCard({ result }: { result: CertificateVerifyResult }) {
	const cert = result.certificate!;
	const trackLabel = cert.track === "offline" ? "Offline" : "Online";

	return (
		<div className='overflow-hidden rounded-2xl border-2 border-black bg-white shadow-[4px_4px_0_#111]'>
			<div className='flex items-center gap-3 border-b-2 border-black bg-[var(--color-primary,#a3e635)] px-5 py-4'>
				<BadgeCheck className='h-8 w-8 shrink-0 text-black' />
				<div>
					<p className='font-heading text-lg font-extrabold text-black'>
						Chứng chỉ hợp lệ
					</p>
					<p className='text-sm text-black/70'>Được cấp bởi CKC IT CLUB</p>
				</div>
			</div>

			<div className='p-5'>
				<div className='flex items-center gap-3'>
					{cert.recipient.avatar ? (
						<img
							src={cert.recipient.avatar}
							alt={cert.recipient.full_name ?? "Học viên"}
							className='h-12 w-12 rounded-full border-2 border-black object-cover'
						/>
					) : (
						<div className='flex h-12 w-12 items-center justify-center rounded-full border-2 border-black bg-gray-100 font-bold text-gray-500'>
							{(cert.recipient.full_name ?? "?").charAt(0)}
						</div>
					)}
					<div>
						<p className='text-xs font-semibold uppercase tracking-wide text-gray-500'>
							Được cấp cho
						</p>
						<p className='font-heading text-lg font-extrabold text-black'>
							{cert.recipient.full_name ?? "Học viên"}
						</p>
					</div>
				</div>

				<dl className='mt-5 space-y-3 border-t-2 border-dashed border-gray-200 pt-4 text-sm'>
					<div className='flex items-start justify-between gap-4'>
						<dt className='text-gray-500'>Khoá học</dt>
						<dd className='text-right font-semibold text-black'>
							{cert.course?.title ?? "--"}
						</dd>
					</div>
					<div className='flex items-center justify-between gap-4'>
						<dt className='text-gray-500'>Hình thức</dt>
						<dd>
							<span className='rounded-full border-2 border-black bg-white px-2.5 py-0.5 text-xs font-bold text-black'>
								{trackLabel}
							</span>
						</dd>
					</div>
					<div className='flex items-center justify-between gap-4'>
						<dt className='flex items-center gap-1.5 text-gray-500'>
							<CalendarDays className='h-4 w-4' /> Ngày cấp
						</dt>
						<dd className='font-semibold text-black'>
							{formatDate(cert.issued_at)}
						</dd>
					</div>
					<div className='flex items-center justify-between gap-4'>
						<dt className='text-gray-500'>Mã chứng chỉ</dt>
						<dd className='font-mono text-xs font-semibold text-black'>
							{cert.cert_code}
						</dd>
					</div>
				</dl>

				<div className='mt-6 flex flex-wrap gap-2'>
					{cert.cert_url && (
						<a
							href={cert.cert_url}
							target='_blank'
							rel='noopener noreferrer'
							className='inline-flex items-center gap-1.5 rounded-lg border-2 border-black bg-[var(--color-primary,#a3e635)] px-4 py-2 text-sm font-extrabold text-black shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
							<ExternalLink className='h-4 w-4' />
							Xem chứng chỉ
						</a>
					)}
					{cert.course && (
						<Link
							to={`/khoa-hoc/${cert.course.slug}`}
							className='inline-flex items-center gap-1.5 rounded-lg border-2 border-black bg-white px-4 py-2 text-sm font-bold text-black shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
							<Award className='h-4 w-4' />
							Khoá học
						</Link>
					)}
				</div>
			</div>
		</div>
	);
}

function StatusCard({
	tone,
	icon,
	title,
	message,
	code,
}: {
	tone: "danger" | "neutral";
	icon: React.ReactNode;
	title: string;
	message: string;
	code?: string | null;
}) {
	const headerBg = tone === "danger" ? "bg-red-500" : "bg-gray-200";
	const headerText = tone === "danger" ? "text-white" : "text-black";

	return (
		<div className='overflow-hidden rounded-2xl border-2 border-black bg-white shadow-[4px_4px_0_#111]'>
			<div
				className={`flex items-center gap-3 border-b-2 border-black px-5 py-4 ${headerBg} ${headerText}`}>
				<span className='shrink-0'>{icon}</span>
				<p className='font-heading text-lg font-extrabold'>{title}</p>
			</div>
			<div className='p-5 text-center'>
				<p className='text-gray-700'>{message}</p>
				{code && (
					<p className='mt-2 font-mono text-xs text-gray-400'>Mã: {code}</p>
				)}
				<Link
					to='/khoa-hoc'
					className='mt-6 inline-block rounded-lg border-2 border-black bg-white px-6 py-2.5 font-bold text-black shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
					Khám phá khoá học
				</Link>
			</div>
		</div>
	);
}

export default CertificateVerifyPage;
