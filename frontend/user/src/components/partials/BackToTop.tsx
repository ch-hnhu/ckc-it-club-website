import React, { useState, useEffect } from "react";
import { ChevronUp } from "lucide-react";

/**
 * BackToTop component provides a button that appears when the user scrolls down,
 * and allows them to scroll back to the top of the page.
 * Styled in Soft Neobrutalism theme.
 */
const BackToTop: React.FC = () => {
	const [isVisible, setIsVisible] = useState(false);

	// Show button when page is scrolled up to 300px
	const toggleVisibility = () => {
		if (window.scrollY > 300) {
			setIsVisible(true);
		} else {
			setIsVisible(false);
		}
	};

	// Set the top scroll to 0
	const scrollToTop = () => {
		window.scrollTo({
			top: 0,
			behavior: "smooth",
		});
	};

	useEffect(() => {
		window.addEventListener("scroll", toggleVisibility);
		return () => {
			window.removeEventListener("scroll", toggleVisibility);
		};
	}, []);

	return (
		<button
			type="button"
			onClick={scrollToTop}
			className={`fixed bottom-6 right-6 z-50 flex items-center justify-center w-12 h-12 rounded-xl border-4 border-black bg-white shadow-[4px_4px_0px_#111] transition-all duration-300 hover:scale-110 active:scale-90 focus:outline-none ${
				isVisible ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-10 pointer-events-none"
			}`}
			aria-label="Back to top"
			title="Cuộn lên đầu trang"
		>
			<ChevronUp className="w-6 h-6 text-black stroke-[3px]" />
		</button>
	);
};

export default BackToTop;
