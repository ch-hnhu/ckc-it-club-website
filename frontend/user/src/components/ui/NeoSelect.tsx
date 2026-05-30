import React, { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export type NeoSelectOption = {
	value: string;
	label: string;
};

type NeoSelectProps = {
	id?: string;
	options: NeoSelectOption[];
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	emptyMessage?: string;
	className?: string;
};

const NeoSelect: React.FC<NeoSelectProps> = ({
	id,
	options,
	value,
	onChange,
	placeholder = "Chọn...",
	emptyMessage = "Không có dữ liệu",
	className = "",
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const selectedLabel = options.find((opt) => opt.value === value)?.label ?? placeholder;

	useEffect(() => {
		if (!isOpen) return;

		const handlePointerDown = (event: PointerEvent) => {
			if (!containerRef.current?.contains(event.target as Node)) {
				setIsOpen(false);
			}
		};

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") setIsOpen(false);
		};

		document.addEventListener("pointerdown", handlePointerDown);
		document.addEventListener("keydown", handleKeyDown);

		return () => {
			document.removeEventListener("pointerdown", handlePointerDown);
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [isOpen]);

	return (
		// Không dùng isolation/z-index trên container — tránh tạo stacking context riêng
		// Dropdown absolute z-[49] được evaluate trong root stacking context
		// → nằm trên sibling z-auto, dưới navbar z-50, tự bám scroll không cần JS
		<div ref={containerRef} className={`relative ${className}`}>
			<button
				id={id}
				type='button'
				onClick={() => setIsOpen((prev) => !prev)}
				aria-haspopup='listbox'
				aria-expanded={isOpen}
				className={`flex h-[3.25rem] w-full items-center justify-between rounded-[10px] border-2 border-black bg-white px-4 font-heading text-base font-extrabold text-black transition hover:bg-gray-50 focus:shadow-[0_0_0_3px_#A3E635] ${
					isOpen ? "bg-[var(--color-pastel-green)]" : ""
				}`}>
				<span>{selectedLabel}</span>
				<ChevronDown
					className={`h-5 w-5 shrink-0 text-gray-600 transition-transform duration-200 ${
						isOpen ? "rotate-180" : ""
					}`}
				/>
			</button>

			{isOpen && (
				<ul
					role='listbox'
					className='absolute top-[calc(100%+0.5rem)] left-0 z-[49] w-full max-h-84 overflow-y-auto space-y-2 rounded-[var(--neo-radius)] border-2 border-black bg-white p-2 shadow-[var(--neo-shadow)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
					{options.length === 0 ? (
						<li className='px-4 py-3 text-sm font-medium text-gray-400 text-center select-none'>
							{emptyMessage}
						</li>
					) : (
						options.map((opt) => {
							const isSelected = opt.value === value;
							return (
								<li key={opt.value} role='option' aria-selected={isSelected}>
									<button
										type='button'
										onClick={() => {
											onChange(opt.value);
											setIsOpen(false);
										}}
										className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left font-heading text-base font-bold transition-colors focus:outline-none focus-visible:bg-[var(--color-primary-100)] ${
											isSelected
												? "bg-[var(--color-primary-100)] text-[var(--color-text-primary)]"
												: "text-gray-700 hover:bg-[var(--color-primary-100)] hover:text-[var(--color-text-primary)]"
										}`}>
										<span>{opt.label}</span>
										{isSelected && (
											<Check className='h-4 w-4 shrink-0 text-[var(--color-text-primary)]' />
										)}
									</button>
								</li>
							);
						})
					)}
				</ul>
			)}
		</div>
	);
};

export default NeoSelect;
