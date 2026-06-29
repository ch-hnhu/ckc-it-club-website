import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LayoutGrid } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { projectHubService } from "@/services/projecthub.service";
import type { Project } from "@/types/projecthub.types";

interface LinkedBoardsCardProps {
	courseId?: number;
	eventId?: number;
}

/**
 * Thẻ liệt kê các board ProjectHub liên kết với một khoá học hoặc sự kiện.
 * Lưu ý: chỉ hiển thị board mà người dùng hiện tại tham gia (API giới hạn theo thành viên).
 */
const LinkedBoardsCard: React.FC<LinkedBoardsCardProps> = ({ courseId, eventId }) => {
	const [boards, setBoards] = useState<Project[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!courseId && !eventId) return;
		let active = true;
		setLoading(true);
		projectHubService
			.listProjects({
				per_page: 50,
				...(courseId ? { course_id: courseId } : {}),
				...(eventId ? { event_id: eventId } : {}),
			})
			.then((res) => active && setBoards(res.data))
			.catch(() => active && setBoards([]))
			.finally(() => active && setLoading(false));
		return () => {
			active = false;
		};
	}, [courseId, eventId]);

	return (
		<Card>
			<CardHeader>
				<CardTitle className='flex items-center gap-2 text-base'>
					<LayoutGrid className='h-4 w-4' /> Bảng ProjectHub liên kết
				</CardTitle>
			</CardHeader>
			<CardContent>
				{loading ? (
					<div className='space-y-2'>
						{Array.from({ length: 2 }).map((_, i) => (
							<Skeleton key={i} className='h-12 rounded-lg' />
						))}
					</div>
				) : boards.length === 0 ? (
					<p className='text-sm text-muted-foreground'>
						Chưa có bảng nào bạn tham gia được liên kết.
					</p>
				) : (
					<ul className='space-y-2'>
						{boards.map((b) => (
							<li key={b.id}>
								<Link
									to={`/to-do-list/${b.slug}`}
									className='flex items-center gap-3 rounded-lg border p-3 transition hover:bg-muted/50'>
									<span
										className='h-8 w-1.5 shrink-0 rounded-full'
										style={{ backgroundColor: b.color || "var(--primary)" }}
									/>
									<div className='min-w-0 flex-1'>
										<p className='truncate font-medium'>{b.name}</p>
										<p className='text-xs text-muted-foreground'>
											{b.columns_count ?? 0} cột · {b.tasks_count ?? 0} công
											việc
										</p>
									</div>
								</Link>
							</li>
						))}
					</ul>
				)}
			</CardContent>
		</Card>
	);
};

export default LinkedBoardsCard;
