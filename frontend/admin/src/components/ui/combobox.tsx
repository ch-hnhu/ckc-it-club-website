"use client";

import * as React from "react";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export type ComboboxOption = {
	value: string;
	label: string;
	disabled?: boolean;
	keywords?: string[];
};

type BaseComboboxProps = {
	options: ComboboxOption[];
	placeholder?: string;
	searchPlaceholder?: string;
	emptyText?: string;
	clearText?: string;
	disabled?: boolean;
	searchable?: boolean;
	className?: string;
	triggerClassName?: string;
	contentClassName?: string;
	maxVisibleBadges?: number;
};

type SingleComboboxProps = BaseComboboxProps & {
	multiple?: false;
	value?: string;
	onValueChange: (value: string) => void;
};

type MultiComboboxProps = BaseComboboxProps & {
	multiple: true;
	value: string[];
	onValueChange: (value: string[]) => void;
};

type ComboboxProps = SingleComboboxProps | MultiComboboxProps;

function Combobox({
	options,
	placeholder = "Select option",
	searchPlaceholder = "Search...",
	emptyText = "Không tìm thấy kết quả.",
	clearText = "Xoá lựa chọn",
	disabled,
	searchable = true,
	className,
	triggerClassName,
	contentClassName,
	maxVisibleBadges = 2,
	...props
}: ComboboxProps) {
	const [open, setOpen] = React.useState(false);

	const multiple = props.multiple === true;
	const selectedValues = multiple ? props.value : props.value ? [props.value] : [];
	const selectedValueSet = new Set(selectedValues);
	const selectedOptions = options.filter((option) => selectedValueSet.has(option.value));

	const hasSelection = selectedOptions.length > 0;

	const handleSelect = (nextValue: string) => {
		if (multiple) {
			const exists = props.value.includes(nextValue);
			const nextValues = exists
				? props.value.filter((value) => value !== nextValue)
				: [...props.value, nextValue];
			props.onValueChange(nextValues);
			return;
		}

		props.onValueChange(nextValue);
		setOpen(false);
	};

	const handleClear = () => {
		if (multiple) {
			props.onValueChange([]);
			return;
		}

		props.onValueChange("");
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					type='button'
					variant='outline'
					role='combobox'
					aria-expanded={open}
					disabled={disabled}
					className={cn("w-full justify-between px-3", triggerClassName)}>
					<span className={cn("truncate", !hasSelection && "text-muted-foreground")}>
						{!hasSelection
							? placeholder
							: multiple
								? selectedOptions.length <= maxVisibleBadges
									? selectedOptions.map((option) => option.label).join(", ")
									: `${selectedOptions
											.slice(0, maxVisibleBadges)
											.map((option) => option.label)
											.join(
												", ",
											)} +${selectedOptions.length - maxVisibleBadges}`
								: selectedOptions[0]?.label}
					</span>

					<div className='ml-2 flex items-center gap-2'>
						{multiple && hasSelection ? (
							<Badge
								variant='secondary'
								className='h-5 rounded-sm px-1.5 text-[11px]'>
								{selectedOptions.length}
							</Badge>
						) : null}
						<ChevronsUpDownIcon className='size-4 shrink-0 opacity-50' />
					</div>
				</Button>
			</PopoverTrigger>

			<PopoverContent
				align='start'
				className={cn("w-(--radix-popover-trigger-width) p-0", contentClassName)}>
				<Command className={className}>
					{searchable ? <CommandInput placeholder={searchPlaceholder} /> : null}

					<CommandList>
						<CommandEmpty>{emptyText}</CommandEmpty>

						<CommandGroup>
							{options.map((option) => {
								const isSelected = selectedValueSet.has(option.value);

								return (
									<CommandItem
										key={option.value}
										value={option.value}
										keywords={[option.label, ...(option.keywords ?? [])]}
										disabled={disabled || option.disabled}
										onSelect={() => handleSelect(option.value)}
										className='gap-2'>
										<CheckIcon
											className={cn(
												"size-4",
												isSelected ? "opacity-100" : "opacity-0",
											)}
										/>
										<span className='flex-1 truncate'>{option.label}</span>
									</CommandItem>
								);
							})}
						</CommandGroup>

						{hasSelection ? (
							<>
								<CommandSeparator />
								<CommandGroup>
									<CommandItem value='__clear_selection__' onSelect={handleClear}>
										{clearText}
									</CommandItem>
								</CommandGroup>
							</>
						) : null}
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}

export { Combobox };
