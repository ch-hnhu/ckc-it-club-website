import React, { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { Award, Download, ExternalLink, Loader2, ScrollText } from "lucide-react";
import type { AuthUser } from "@/services/auth.service";
import { learningService } from "@/services/learning.service";
import type { MyCertificate } from "@/types/learning.types";

type OutletCtx = { user: AuthUser | null; loadingUser: boolean };

const dtf = new Intl.DateTimeFormat("vi-VN", { dateStyle: "long" });

function formatDate(value: string | null) {
	if (!value) return "--";
	const d = new Date(value);
	return Number.isNaN(d.getTime()) ? "--" : dtf.format(d);
}

function CertificateCard({ cert }: { cert: MyCertificate }) {
	const title = cert.course?.title ?? "Khoá học";
	const trackLabel = cert.track === "offline" ? "Offline" : "Online";

	return (
		<div className='flex flex-col overflow-hidden rounded-2xl border-2 border-black bg-white shadow-[4px_4px_0_#111]'>
			<div className='relative aspect-video w-full overflow-hidden border-b-2 border-black bg-[var(--color-pastel-blue,#dbeafe)]'>
				{cert.course?.thumbnail ? (
					<img
						src={cert.course.thumbnail}
						alt={title}
						className='h-full w-full object-cover'
					/>
				) : (
					<div className='flex h-full w-full items-center justify-center'>
						<Award className='h-12 w-12 text-black/30' />
					</div>
				)}
				<span className='absolute top-3 right-3 rounded-full border-2 border-black bg-white px-2.5 py-1 text-xs font-bold text-black shadow-[2px_2px_0_#111]'>
					{trackLabel}
				</span>
			</div>

			<div className='flex flex-1 flex-col p-5'>
				<h3 className='font-heading text-lg font-extrabold text-black'>{title}</h3>
				<p className='mt-1 text-sm text-gray-600'>
					Cấp ngày <span className='font-semibold'>{formatDate(cert.issued_at)}</span>
				</p>
				<p className='mt-0.5 text-xs text-gray-400'>Mã: {cert.cert_code}</p>

				<div className='mt-auto flex flex-wrap gap-2 pt-4'>
					<a
						href={cert.cert_url}
						target='_blank'
						rel='noopener noreferrer'
						className='inline-flex items-center gap-1.5 rounded-lg border-2 border-black bg-[var(--color-primary,#a3e635)] px-3 py-2 text-sm font-extrabold text-black shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
						<Download className='h-4 w-4' />
						Xem chứng chỉ
					</a>
					{cert.course && (
						<Link
							to={`/khoa-hoc/${cert.course.slug}`}
							className='inline-flex items-center gap-1.5 rounded-lg border-2 border-black bg-white px-3 py-2 text-sm font-bold text-black shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
							<ExternalLink className='h-4 w-4' />
							Khoá học
						</Link>
					)}
				</div>
			</div>
		</div>
	);
}

const MyCertificatesPage: React.FC = () => {
	const { user, loadingUser } = useOutletContext<OutletCtx>();

	const [certificates, setCertificates] = useState<MyCertificate[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (loadingUser) return;
		if (!user) {
			setLoading(false);
			return;
		}

		let cancelled = false;
		setLoading(true);

		learningService
			.getMyCertificates()
			.then((res) => {
				if (!cancelled) setCertificates(res.data);
			})
			.catch(() => {
				if (!cancelled) setCertificates([]);
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [user, loadingUser]);

	if (loadingUser || loading) {
		return (
			<div className='flex min-h-[60vh] items-center justify-center pt-20'>
				<Loader2 className='h-8 w-8 animate-spin text-gray-400' />
			</div>
		);
	}

	if (!user) {
		return (
			<div className='mx-auto max-w-2xl px-4 pb-16 pt-24 text-center md:pt-28'>
				<ScrollText className='mx-auto mb-4 h-12 w-12 text-gray-300' />
				<h1 className='font-heading text-2xl font-extrabold'>Chứng chỉ của tôi</h1>
				<p className='mt-2 text-gray-600'>
					Vui lòng đăng nhập để xem chứng chỉ của bạn.
				</p>
				<Link
					to='/login'
					className='mt-6 inline-block rounded-lg border-2 border-black bg-white px-6 py-2.5 font-bold text-black shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
					Đăng nhập
				</Link>
			</div>
		);
	}

	return (
		<div className='mx-auto w-full max-w-4xl px-4 pb-12 pt-24 md:pt-28'>
			<div className='mb-8 flex items-center justify-between'>
				<div>
					<h1 className='font-heading text-3xl font-extrabold text-black'>
						Chứng chỉ của tôi
					</h1>
					<p className='mt-1 text-gray-600'>
						Tất cả chứng chỉ bạn đã đạt được khi hoàn thành khoá học.
					</p>
				</div>
				<Link
					to='/khoa-hoc'
					className='hidden items-center gap-2 rounded-lg border-2 border-black bg-white px-4 py-2 font-bold text-black shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none sm:flex'>
					<Award className='h-4 w-4' />
					Khoá học
				</Link>
			</div>

			{certificates.length > 0 ? (
				<div className='grid gap-5 sm:grid-cols-2'>
					{certificates.map((cert) => (
						<CertificateCard key={cert.cert_code} cert={cert} />
					))}
				</div>
			) : (
				<div className='rounded-2xl border-2 border-black bg-white px-5 py-16 text-center shadow-[4px_4px_0_#111]'>
					<ScrollText className='mx-auto mb-4 h-12 w-12 text-gray-300' />
					<p className='font-semibold text-gray-700'>Bạn chưa có chứng chỉ nào.</p>
					<p className='mt-1 text-sm text-gray-500'>
						Hoàn thành một khoá học để nhận chứng chỉ đầu tiên của bạn!
					</p>
					<Link
						to='/khoa-hoc'
						className='mt-6 inline-block rounded-lg border-2 border-black bg-[var(--color-primary,#a3e635)] px-6 py-2.5 font-extrabold text-black shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
						Khám phá khoá học
					</Link>
				</div>
			)}
		</div>
	);
};

export default MyCertificatesPage;
