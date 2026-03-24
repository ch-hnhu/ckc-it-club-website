function Footer() {
	return (
		<>
			{/* begin::Footer */}
			<footer className='app-footer border-t border-[#e0e0e0] bg-[#f9fafb] text-[#666666] py-6 px-6'>
				<div className='flex items-center justify-between'>
					<div>
						<strong className='text-[#1a1a1a]'>
							CKC IT CLUB Dashboard
						</strong>
						<p className='text-sm mt-1'>© 2024 All rights reserved.</p>
					</div>
					<div className='text-sm'>
						<a href='#' className='text-[#2e3820] hover:underline'>Privacy</a>
						<span className='mx-2'>•</span>
						<a href='#' className='text-[#2e3820] hover:underline'>Terms</a>
						<span className='mx-2'>•</span>
						<a href='#' className='text-[#2e3820] hover:underline'>Support</a>
					</div>
				</div>
			</footer>
			{/* end::Footer */}
		</>
	);
}

export default Footer;
