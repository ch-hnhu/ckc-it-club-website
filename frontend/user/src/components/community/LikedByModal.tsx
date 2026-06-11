import React, { useEffect, useState } from "react";
import { X, UserPlus, UserCheck } from "lucide-react";
import { Link } from "react-router-dom";
import type { Reactor } from "@/types/post.types";
import type { AuthUser } from "@/services/auth.service";
import { userService } from "@/services/user.service";
import { buildAvatar, buildProfileUrl, getHandle } from "@/lib/utils";

interface LikedByModalProps {
	reactors: Reactor[];
	loading: boolean;
	currentUser: AuthUser | null;
	onClose: () => void;
}

const LikedByModal: React.FC<LikedByModalProps> = ({ reactors, loading, currentUser, onClose }) => {
	const [followStates, setFollowStates] = useState<Record<number, boolean>>({});

	useEffect(() => {
		const init: Record<number, boolean> = {};
		reactors.forEach((r) => {
			init[r.id] = r.is_following;
		});
		setFollowStates(init);
	}, [reactors]);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [onClose]);

	const handleFollow = async (reactor: Reactor) => {
		const handle = getHandle(reactor.username, reactor.email).replace("@", "");
		const wasFollowing = followStates[reactor.id] ?? reactor.is_following;
		setFollowStates((s) => ({ ...s, [reactor.id]: !wasFollowing }));
		try {
			await userService.toggleFollow(handle);
		} catch {
			setFollowStates((s) => ({ ...s, [reactor.id]: wasFollowing }));
		}
	};

	return (
		<div
			className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4'
			onClick={onClose}>
			<div
				className='relative flex w-full max-w-sm flex-col overflow-hidden rounded-2xl border-2 border-black shadow-[4px_4px_0_#000]'
				onClick={(e) => e.stopPropagation()}>
				{/* Header — theme green */}
				<div className='flex items-center justify-between border-b-2 border-black bg-[var(--color-primary)] px-5 py-4'>
					<h2 className='text-base font-bold text-black'>Liked by</h2>
					<button
						onClick={onClose}
						className='rounded-lg p-1 text-black/60 transition hover:text-black'>
						<X className='h-5 w-5' />
					</button>
				</div>

				{/* User list — white background */}
				<div className='max-h-[420px] overflow-y-auto bg-white p-3'>
					{loading ? (
						<div className='py-10 text-center text-sm text-gray-400'>Đang tải...</div>
					) : reactors.length === 0 ? (
						<div className='py-10 text-center text-sm text-gray-400'>
							Chưa có ai thích bài viết này.
						</div>
					) : (
						reactors.map((reactor) => {
							const avatar = buildAvatar(reactor.full_name, reactor.avatar);
							const handle = getHandle(reactor.username, reactor.email);
							const profileUrl = buildProfileUrl(reactor.username, reactor.email);
							const isMe = currentUser && Number(currentUser.id) === reactor.id;
							const isFollowing = followStates[reactor.id] ?? reactor.is_following;

							return (
								<div
									key={reactor.id}
									className='flex items-center gap-3 rounded-xl border-2 border-black bg-white px-3 py-2.5 mb-2 last:mb-0'>
									<Link to={profileUrl} onClick={onClose} className='shrink-0'>
										<img
											src={avatar}
											alt={reactor.full_name}
											className='h-10 w-10 rounded-full border-2 border-black object-cover'
										/>
									</Link>
									<div className='min-w-0 flex-1'>
										<Link
											to={profileUrl}
											onClick={onClose}
											className='block truncate text-sm font-bold text-black hover:underline'>
											{reactor.full_name}
										</Link>
										<span className='text-xs text-gray-500'>{handle}</span>
									</div>
									{!isMe && currentUser && (
										<button
											onClick={() => handleFollow(reactor)}
											className={`flex shrink-0 items-center gap-1.5 rounded-lg border-2 border-black px-3 py-1.5 text-xs font-bold shadow-[2px_2px_0_#000] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none ${
												isFollowing
													? "bg-gray-100 text-black shadow-none translate-x-[1px] translate-y-[1px]"
													: "bg-[var(--color-primary)] text-black"
											}`}>
											{isFollowing ? (
												<>
													<UserCheck className='h-3.5 w-3.5' />
													Đang theo dõi
												</>
											) : (
												<>
													<UserPlus className='h-3.5 w-3.5' />
													Follow
												</>
											)}
										</button>
									)}
								</div>
							);
						})
					)}
				</div>
			</div>
		</div>
	);
};

export default LikedByModal;
