import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type CompactBadgeItem = {
	key: string | number;
	label: string;
	className?: string;
};

type CompactBadgeListProps = {
	items: CompactBadgeItem[];
	maxVisibleItems?: number;
	emptyLabel?: string;
	className?: string;
	badgeClassName?: string;
	overflowBadgeClassName?: string;
};

function CompactBadgeList({
	items,
	maxVisibleItems = 2,
	emptyLabel = "--",
	className,
	badgeClassName,
	overflowBadgeClassName,
}: CompactBadgeListProps) {
	if (items.length === 0) {
		return <span className={cn("text-sm text-muted-foreground", className)}>{emptyLabel}</span>;
	}

	const visibleItems = items.slice(0, maxVisibleItems);
	const hiddenCount = Math.max(0, items.length - visibleItems.length);

	return (
		<div className={cn("flex flex-wrap items-center gap-1.5", className)}>
			{visibleItems.map((item) => (
				<Badge
					key={item.key}
					variant='outline'
					className={cn(
						"rounded-full px-3 py-1 text-xs",
						badgeClassName,
						item.className,
					)}>
					{item.label}
				</Badge>
			))}
			{hiddenCount > 0 ? (
				<Badge
					variant='secondary'
					className={cn("rounded-full px-3 py-1 text-xs", overflowBadgeClassName)}>
					+{hiddenCount}
				</Badge>
			) : null}
		</div>
	);
}

export { CompactBadgeList };
