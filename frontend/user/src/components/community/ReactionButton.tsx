/**
 * ReactionButton – emoji reaction picker for community posts.
 *
 * Click the button → open emoji picker.
 * Click an emoji  → toggle that reaction (same emoji = remove, different = switch).
 * Click outside or press Escape → close picker.
 * Guest user       → navigates to /login instead of opening picker.
 */

import React, { useEffect, useRef, useState } from "react";
import { Heart } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { postService } from "@/services/post.service";
import type { AuthUser } from "@/services/auth.service";
import type { ReactionType, ReactionToggleResponse } from "@/types/post.types";

// ---------------------------------------------------------------------------
// Reaction definitions
// ---------------------------------------------------------------------------

export const REACTIONS: { type: ReactionType; emoji: string; label: string }[] = [
	{ type: "heart", emoji: "❤️", label: "Tim" },
	{ type: "like",  emoji: "👍", label: "Thích" },
	{ type: "haha",  emoji: "😂", label: "Haha" },
	{ type: "wow",   emoji: "😮", label: "Wow" },
	{ type: "sad",   emoji: "😢", label: "Buồn" },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ReactionButtonProps {
	postId: number;
	initialCount: number;
	initialReaction: ReactionType | null;
	user: AuthUser | null;
	/** "sm" for PostCard list, "md" for detail page */
	size?: "sm" | "md";
	/** Called after a successful reaction toggle */
	onReacted?: (data: ReactionToggleResponse) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ReactionButton: React.FC<ReactionButtonProps> = ({
	postId,
	initialCount,
	initialReaction,
	user,
	size = "sm",
	onReacted,
}) => {
	const navigate = useNavigate();
	const location = useLocation();

	const [isOpen,     setIsOpen]     = useState(false);
	const [myReaction, setMyReaction] = useState<ReactionType | null>(initialReaction);
	const [count,      setCount]      = useState(initialCount);
	const [loading,    setLoading]    = useState(false);

	const wrapperRef = useRef<HTMLDivElement>(null);

	// ----- close on outside click -----
	useEffect(() => {
		if (!isOpen) return;
		const onMouseDown = (e: MouseEvent) => {
			if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
				setIsOpen(false);
			}
		};
		document.addEventListener("mousedown", onMouseDown);
		return () => document.removeEventListener("mousedown", onMouseDown);
	}, [isOpen]);

	// ----- close on Escape -----
	useEffect(() => {
		if (!isOpen) return;
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") setIsOpen(false);
		};
		document.addEventListener("keydown", onKeyDown);
		return () => document.removeEventListener("keydown", onKeyDown);
	}, [isOpen]);

	// ----- react handler -----
	const handleReact = async (type: ReactionType) => {
		if (loading) return;
		setLoading(true);

		// Optimistic update
		const prev = myReaction;
		const prevCount = count;
		if (prev === type) {
			setMyReaction(null);
			setCount((c) => Math.max(0, c - 1));
		} else if (prev === null) {
			setMyReaction(type);
			setCount((c) => c + 1);
		} else {
			setMyReaction(type); // count stays the same (switch)
		}
		setIsOpen(false);

		try {
			const res = await postService.toggleReaction(postId, type);
			// Sync with server response
			setMyReaction(res.data.my_reaction);
			setCount(res.data.reactions_count);
			onReacted?.(res.data);
		} catch {
			// Rollback optimistic update on error
			setMyReaction(prev);
			setCount(prevCount);
		} finally {
			setLoading(false);
		}
	};

	// ----- open handler (guest → login) -----
	const handleOpen = () => {
		if (!user) {
			navigate("/login", { state: { from: location.pathname + location.search } });
			return;
		}
		setIsOpen((o) => !o);
	};

	const currentReaction = REACTIONS.find((r) => r.type === myReaction);
	const isReacted       = !!myReaction;

	const btnHeight = size === "md" ? "h-10" : "h-9";

	return (
		<div className='relative' ref={wrapperRef}>

			{/* ── Emoji picker popup ── */}
			{isOpen && (
				<div className='absolute bottom-full left-0 z-50 mb-2 flex items-end gap-1 rounded-2xl border-2 border-black bg-white px-3 py-2 shadow-[4px_4px_0_#111]'>
					{REACTIONS.map((r) => {
						const isActive = myReaction === r.type;
						return (
							<button
								key={r.type}
								title={r.label}
								disabled={loading}
								onClick={() => handleReact(r.type)}
								className={`group flex flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 transition-all duration-150 active:scale-95 disabled:opacity-60 ${
									isActive
										? "bg-[var(--color-pastel-yellow)] ring-2 ring-black scale-110"
										: "hover:scale-125 hover:bg-gray-50"
								}`}>
								<span className='text-2xl leading-none'>{r.emoji}</span>
								<span
									className={`text-[9px] font-extrabold tracking-wide ${
										isActive ? "text-black" : "text-gray-500"
									}`}>
									{r.label}
								</span>
							</button>
						);
					})}
				</div>
			)}

			{/* ── Main reaction button ── */}
			<button
				onClick={handleOpen}
				disabled={loading}
				aria-label={isReacted ? `Đang ${currentReaction?.label} · ${count}` : "Thả cảm xúc"}
				className={`inline-flex ${btnHeight} select-none items-center gap-2 rounded-lg border-2 border-black px-3 text-sm font-bold shadow-[2px_2px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none disabled:opacity-60`}
				style={{ background: isReacted ? "var(--color-pastel-pink)" : "#fff" }}>
				{isReacted ? (
					<span className='text-base leading-none'>{currentReaction?.emoji}</span>
				) : (
					<Heart className='h-4 w-4' />
				)}
				<span className='tabular-nums'>{count}</span>
			</button>

		</div>
	);
};

export default ReactionButton;
