import React, { useEffect, useRef, useState } from "react";
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

const VI_MONTHS = [
	"Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4",
	"Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8",
	"Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
];

// Week starts Monday (Vietnamese standard): T2 T3 T4 T5 T6 T7 CN
const WEEK_DAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

function dayOfWeekIndex(date: Date): number {
	const d = date.getDay(); // 0=Sun
	return d === 0 ? 6 : d - 1; // Mon=0 … Sun=6
}

function toIso(year: number, month: number, day: number): string {
	return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatDisplay(iso: string): string {
	const [y, m, d] = iso.split("-");
	return `${d}/${m}/${y}`;
}

type Props = {
	value: string; // "YYYY-MM-DD" or ""
	onChange: (value: string) => void;
	placeholder?: string;
	className?: string;
};

const NeoDatePicker: React.FC<Props> = ({
	value,
	onChange,
	placeholder = "Chọn ngày..",
	className = "",
}) => {
	const parseValue = (v: string) => ({
		year: v ? parseInt(v.split("-")[0]) : new Date().getFullYear(),
		month: v ? parseInt(v.split("-")[1]) - 1 : new Date().getMonth(),
	});

	const [isOpen, setIsOpen] = useState(false);
	const [mode, setMode] = useState<"calendar" | "year">("calendar");
	const [viewYear, setViewYear] = useState(() => parseValue(value).year);
	const [viewMonth, setViewMonth] = useState(() => parseValue(value).month);
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (value) {
			const { year, month } = parseValue(value);
			setViewYear(year);
			setViewMonth(month);
		}
	}, [value]);

	useEffect(() => {
		if (!isOpen) return;
		const onPointerDown = (e: PointerEvent) => {
			if (!containerRef.current?.contains(e.target as Node)) {
				setIsOpen(false);
				setMode("calendar");
			}
		};
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") { setIsOpen(false); setMode("calendar"); }
		};
		document.addEventListener("pointerdown", onPointerDown);
		document.addEventListener("keydown", onKeyDown);
		return () => {
			document.removeEventListener("pointerdown", onPointerDown);
			document.removeEventListener("keydown", onKeyDown);
		};
	}, [isOpen]);

	const today = new Date();
	const todayIso = toIso(today.getFullYear(), today.getMonth(), today.getDate());

	// Calendar grid
	const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
	const startOffset = dayOfWeekIndex(new Date(viewYear, viewMonth, 1));
	const cells: (number | null)[] = [
		...Array<null>(startOffset).fill(null),
		...Array.from({ length: daysInMonth }, (_, i) => i + 1),
	];
	while (cells.length % 7 !== 0) cells.push(null);

	const prevMonth = () => {
		if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
		else setViewMonth((m) => m - 1);
	};
	const nextMonth = () => {
		if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
		else setViewMonth((m) => m + 1);
	};

	// Year picker — 12-year block
	const blockStart = Math.floor(viewYear / 12) * 12;
	const yearBlock = Array.from({ length: 12 }, (_, i) => blockStart + i);

	return (
		<div ref={containerRef} className={`relative ${className}`}>
			<button
				type="button"
				onClick={() => setIsOpen((p) => !p)}
				className={`flex h-[3.25rem] w-full items-center justify-between rounded-[10px] border-2 border-black bg-white px-4 transition hover:bg-gray-50 focus:outline-none focus:shadow-[0_0_0_3px_#A3E635] ${
					isOpen ? "bg-[var(--color-pastel-green)]" : ""
				}`}
			>
				<span
					className={
						value
							? "font-heading text-base font-extrabold text-black"
							: "text-sm font-medium text-gray-400"
					}
				>
					{value ? formatDisplay(value) : placeholder}
				</span>
				<Calendar className="h-4 w-4 shrink-0 text-gray-500" />
			</button>

			{isOpen && (
				<div className="absolute top-[calc(100%+0.5rem)] left-0 z-[49] w-72 rounded-[var(--neo-radius)] border-2 border-black bg-white p-3 shadow-[var(--neo-shadow)]">
					{mode === "calendar" ? (
						<>
							{/* Header */}
							<div className="mb-3 flex items-center justify-between">
								<button
									type="button"
									onClick={prevMonth}
									className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-black transition hover:bg-gray-100"
								>
									<ChevronLeft className="h-4 w-4" />
								</button>
								<button
									type="button"
									onClick={() => setMode("year")}
									className="flex items-center gap-1 rounded-lg px-2 py-1 font-heading text-sm font-extrabold text-black transition hover:bg-gray-100"
								>
									{VI_MONTHS[viewMonth]} {viewYear}
									<ChevronDown className="h-3.5 w-3.5 text-gray-500" />
								</button>
								<button
									type="button"
									onClick={nextMonth}
									className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-black transition hover:bg-gray-100"
								>
									<ChevronRight className="h-4 w-4" />
								</button>
							</div>

							{/* Day-of-week headers */}
							<div className="mb-1 grid grid-cols-7 text-center">
								{WEEK_DAYS.map((d) => (
									<div key={d} className="py-0.5 text-[11px] font-bold text-gray-400">
										{d}
									</div>
								))}
							</div>

							{/* Day cells */}
							<div className="grid grid-cols-7 gap-y-0.5">
								{cells.map((day, i) => {
									if (day === null) return <div key={i} />;
									const iso = toIso(viewYear, viewMonth, day);
									const isSelected = iso === value;
									const isToday = iso === todayIso;
									return (
										<button
											key={i}
											type="button"
											onClick={() => {
												onChange(iso);
												setIsOpen(false);
											}}
											className={`mx-auto flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold transition
												${
													isSelected
														? "border-2 border-black bg-[var(--color-primary)] text-black shadow-[2px_2px_0_#111]"
														: isToday
														? "border-2 border-black bg-white text-black"
														: "text-gray-700 hover:bg-[var(--color-primary-100)] hover:text-black"
												}`}
										>
											{day}
										</button>
									);
								})}
							</div>
						</>
					) : (
						<>
							{/* Year picker header */}
							<div className="mb-3 flex items-center justify-between">
								<button
									type="button"
									onClick={() => setViewYear((y) => y - 12)}
									className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-black transition hover:bg-gray-100"
								>
									<ChevronLeft className="h-4 w-4" />
								</button>
								<span className="font-heading text-sm font-extrabold text-black">
									{blockStart} – {blockStart + 11}
								</span>
								<button
									type="button"
									onClick={() => setViewYear((y) => y + 12)}
									className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-black transition hover:bg-gray-100"
								>
									<ChevronRight className="h-4 w-4" />
								</button>
							</div>

							{/* Year grid */}
							<div className="grid grid-cols-3 gap-2">
								{yearBlock.map((y) => (
									<button
										key={y}
										type="button"
										onClick={() => {
											setViewYear(y);
											setMode("calendar");
										}}
										className={`rounded-xl border-2 py-2 text-sm font-bold transition
											${
												y === viewYear
													? "border-black bg-[var(--color-primary)] text-black shadow-[2px_2px_0_#111]"
													: "border-transparent text-gray-700 hover:border-gray-300 hover:bg-gray-50"
											}`}
									>
										{y}
									</button>
								))}
							</div>
						</>
					)}
				</div>
			)}
		</div>
	);
};

export default NeoDatePicker;
