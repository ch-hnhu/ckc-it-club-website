import React from "react";
import { Link } from "react-router-dom";
import { CalendarDays, MapPin, Users } from "lucide-react";
import type { EventItem, EventStatus } from "@/types/event.types";
import { formatEventDate, formatEventTime } from "@/lib/eventFormat";

interface EventCardProps {
	event: EventItem;
	featured?: boolean;
}

const STATUS_LABEL: Record<EventStatus, string> = {
	draft: "Bản nháp",
	published: "Sắp diễn ra",
	ongoing: "Đang diễn ra",
	ended: "Đã kết thúc",
	cancelled: "Đã hủy",
};

const STATUS_BADGE_CLASS: Record<EventStatus, string> = {
	draft: "bg-gray-100 text-gray-600",
	published: "bg-[var(--color-primary)] text-black",
	ongoing: "bg-[var(--color-pastel-blue)] text-black",
	ended: "bg-gray-100 text-black",
	cancelled: "bg-[var(--color-pastel-pink)] text-black",
};

export const EventStatusBadge: React.FC<{ status: EventStatus }> = ({ status }) => (
	<span
		className={`inline-flex items-center rounded-full border-2 border-black px-3 py-1 font-heading text-[10px] font-extrabold uppercase text-black tracking-wide ${STATUS_BADGE_CLASS[status]}`}>
		{STATUS_LABEL[status]}
	</span>
);

const EventCard: React.FC<EventCardProps> = ({ event, featured = false }) => {
	const detailUrl = `/su-kien/${event.slug}`;
	const aspect = featured ? "aspect-[21/9]" : "aspect-[16/9]";

	return (
		<Link
			to={detailUrl}
			className='group neo-card neo-card-static relative flex flex-col overflow-hidden bg-white'>
			<div className='absolute left-3 top-3 z-10'>
				<EventStatusBadge status={event.status} />
			</div>

			<div className='overflow-hidden bg-gray-100'>
				{event.thumbnail ? (
					<img
						src={event.thumbnail}
						alt={event.title}
						className={`${aspect} w-full object-cover transition-transform duration-500 group-hover:scale-105`}
					/>
				) : (
					<div
						className={`flex ${aspect} w-full items-center justify-center bg-[var(--color-pastel-green)]`}>
						<span className='font-heading text-6xl font-extrabold text-[var(--color-text-primary)] opacity-20'>
							{event.title.charAt(0).toUpperCase()}
						</span>
					</div>
				)}
			</div>

			<div className='flex flex-1 flex-col p-5'>
				<h3 className='line-clamp-2 font-heading text-lg font-extrabold leading-snug text-black group-hover:text-[var(--color-text-primary)] group-hover:underline'>
					{event.title}
				</h3>

				{event.description && (
					<p className='mt-2 line-clamp-2 text-sm leading-6 text-gray-600'>
						{event.description}
					</p>
				)}

				<div className='mt-4 space-y-1.5 text-sm text-gray-700'>
					<div className='flex items-center gap-2'>
						<CalendarDays className='h-4 w-4 shrink-0 text-gray-400' />
						<span className='font-medium'>
							{formatEventDate(event.start_at)} · {formatEventTime(event.start_at)} -{" "}
							{formatEventTime(event.end_at)}
						</span>
					</div>
					{event.location && (
						<div className='flex items-center gap-2'>
							<MapPin className='h-4 w-4 shrink-0 text-gray-400' />
							<span className='line-clamp-1'>{event.location}</span>
						</div>
					)}
				</div>

				<div className='min-h-3 flex-1' />

				<div className='flex items-center justify-between border-t-2 border-black pt-3'>
					<div className='flex items-center gap-1.5 text-xs font-bold text-gray-600'>
						<Users className='h-3.5 w-3.5' />
						{event.registrations_count}
						{event.max_attendees ? ` / ${event.max_attendees}` : ""} người tham gia
					</div>
					{event.is_full && (
						<span className='rounded-full border-2 border-black bg-[var(--color-pastel-orange)] px-2.5 py-0.5 text-[10px] font-extrabold uppercase'>
							Hết chỗ
						</span>
					)}
					{event.my_registration_status === "registered" && !event.is_full && (
						<span className='rounded-full border-2 border-black bg-[var(--color-pastel-green)] px-2.5 py-0.5 text-[10px] font-extrabold uppercase'>
							Đã đăng ký
						</span>
					)}
				</div>
			</div>
		</Link>
	);
};

export default EventCard;
