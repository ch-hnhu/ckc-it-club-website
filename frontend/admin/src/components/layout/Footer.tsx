function Footer() {
	return (
		<footer className='flex-shrink-0 border-t border-border bg-background p-4 text-muted-foreground'>
			<div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1'>
				<div>
					<strong className='text-foreground'>CKC IT CLUB</strong>
				</div>
				<div className='text-sm'>
					<p className='text-sm mt-1'>© 2026 All rights reserved.</p>
				</div>
			</div>
		</footer>
	);
}

export default Footer;
