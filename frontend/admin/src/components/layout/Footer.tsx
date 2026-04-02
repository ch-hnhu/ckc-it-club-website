function Footer() {
	return (
		<footer className='flex-shrink-0 border-t border-[#e0e0e0] dark:border-zinc-800 bg-[#f9fafb] dark:bg-zinc-950 text-[#666666] dark:text-zinc-400 p-4'>
			<div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1'>
				<div>
					<strong className='text-[#1a1a1a] dark:text-zinc-100'>CKC IT CLUB</strong>
				</div>
				<div className='text-sm'>
					<p className='text-sm mt-1'>© 2026 All rights reserved.</p>
				</div>
			</div>
		</footer>
	);
}

export default Footer;
