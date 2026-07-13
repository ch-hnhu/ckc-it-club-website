import React, { useEffect, useRef } from "react";
import { Scale } from "lucide-react";
import { renderMarkdownContent } from "@/lib/markdown";

// @ts-ignore
import rulesMarkdown from "@/config/community-rules.md?raw";

const CommunityRulesPage: React.FC = () => {
	const observerRef = useRef<IntersectionObserver | null>(null);

	useEffect(() => {
		observerRef.current = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						entry.target.classList.add("animate-fade-in-up", "opacity-100");
						entry.target.classList.remove("opacity-0", "translate-y-10");
						observerRef.current?.unobserve(entry.target);
					}
				});
			},
			{ threshold: 0.1 }
		);

		const elements = document.querySelectorAll(".reveal-on-scroll");
		elements.forEach((el) => observerRef.current?.observe(el));

		return () => observerRef.current?.disconnect();
	}, []);

	// Render the markdown content
	const renderedContent = renderMarkdownContent(rulesMarkdown);

	return (
		<div className='min-h-screen bg-[var(--color-background)] pb-20 pt-28 font-body text-black'>
			{/* Hero Section */}
			<div className='container mx-auto px-4 sm:px-6 lg:px-8'>
				<div className='reveal-on-scroll mx-auto max-w-4xl text-center opacity-0 transition-all duration-700'>
					<div className='mb-6 inline-flex items-center gap-2 rounded-full border-2 border-black bg-white px-4 py-2 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'>
						<Scale className='h-5 w-5 text-[var(--color-primary)]' />
						<span className='tracking-wide uppercase text-sm'>Văn hoá cộng đồng</span>
					</div>
					<h1 className='font-heading text-4xl font-black uppercase md:text-5xl lg:text-6xl'>
						QUY TẮC CỘNG ĐỒNG
					</h1>
					<p className='mx-auto mt-6 max-w-2xl text-lg font-medium text-gray-700 md:text-xl'>
						Cùng nhau xây dựng một môi trường kết nối, học tập và chia sẻ văn minh, an toàn và chuyên nghiệp dành cho sinh viên yêu công nghệ.
					</p>
				</div>
			</div>

			{/* Main Content Area */}
			<div className='container mx-auto mt-16 px-4 sm:px-6 lg:px-8'>
				<div className='mx-auto max-w-4xl'>

					{/* Markdown Content */}
					<div className='reveal-on-scroll opacity-0 transition-all duration-700 delay-100'>
						<div className='neo-card bg-white p-6 sm:p-10 lg:p-12'>
							<div
								className='community-markdown community-rules s-prose'
								dangerouslySetInnerHTML={{ __html: renderedContent }}
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default CommunityRulesPage;
