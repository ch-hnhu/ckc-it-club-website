function Footer() {
	return (
		<footer className='flex-shrink-0 border-t border-[#e0e0e0] bg-[#f9fafb] text-[#666666] py-6 px-6'>
			<div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
				<div>
					<strong className='text-[#1a1a1a]'>
						CKC IT CLUB Dashboard
					</strong>
					<p className='text-sm mt-1'>© 2024 All rights reserved.</p>
				</div>
				<div className='text-sm flex gap-1'>
					<a href='#' className='text-[#2e3820] hover:underline'>Privacy</a>
					<span>•</span>
					<a href='#' className='text-[#2e3820] hover:underline'>Terms</a>
					<span>•</span>
					<a href='#' className='text-[#2e3820] hover:underline'>Support</a>
				</div>
			</div>
		</footer>
	);
}

export default Footer;
