import { Link } from "react-router-dom";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import React from "react";

export type BreadcrumbItemType = {
	title: string;
	link?: string;
};

export interface CustomBreadcrumbProps {
	items: BreadcrumbItemType[];
}

export function CustomBreadcrumb({ items }: CustomBreadcrumbProps) {
	if (!items || items.length === 0) return null;

	return (
		<Breadcrumb>
			<BreadcrumbList>
				{items.map((item, index) => {
					const isLast = index === items.length - 1;

					return (
						<React.Fragment key={index}>
							<BreadcrumbItem
								className={
									index === 0 && items.length > 1 ? "hidden md:block" : ""
								}>
								{!isLast && item.link ? (
									<BreadcrumbLink
										asChild
										className='hidden md:block text-primary/60! hover:text-primary! transition-colors'>
										<Link to={item.link}>{item.title}</Link>
									</BreadcrumbLink>
								) : (
									<BreadcrumbPage className='hidden md:block'>
										{item.title}
									</BreadcrumbPage>
								)}
							</BreadcrumbItem>
							{!isLast && (
								<BreadcrumbSeparator
									className={
										index === 0 && items.length > 1 ? "hidden md:block" : ""
									}
								/>
							)}
						</React.Fragment>
					);
				})}
			</BreadcrumbList>
		</Breadcrumb>
	);
}
