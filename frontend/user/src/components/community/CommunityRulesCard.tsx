import React from "react";
import { Link } from "react-router-dom";

const CommunityRulesCard: React.FC = () => {
	return (
		<Link
			to='/quy-tac-cong-dong'
			className='neo-card neo-card-static mt-5 flex w-full cursor-pointer items-center gap-3 bg-white p-3 text-left transition hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2'
			aria-label='Đọc Quy tắc cộng đồng'>
			<svg
				xmlns='http://www.w3.org/2000/svg'
				width='40'
				height='41'
				viewBox='0 0 40 41'
				fill='none'
				className='h-10 w-10 shrink-0'
				aria-hidden='true'>
				<path
					d='M10 5.55176H33.3334V8.88509H36.6667V18.8851H33.3334V32.2184H30V35.5518H6.66671V32.2184H3.33337V28.8851V25.5518H6.66671V8.88509H10V5.55176Z'
					fill='#FEF08A'
				/>
				<path
					fillRule='evenodd'
					clipRule='evenodd'
					d='M10 5.55176H33.3334V8.88509H36.6667V18.8851H33.3334V32.2184H30V8.88509H10V5.55176ZM23.3334 28.8851V25.5518H10V8.88509H6.66671V25.5518H3.33337V28.8851V32.2184H6.66671V35.5518H30V32.2184L26.6667 32.2184V28.8851H23.3334ZM23.3334 28.8851V32.2184H6.66671V28.8851H23.3334Z'
					fill='#713F12'
				/>
				<rect x='13.3334' y='18.8853' width='13.3333' height='3.33333' fill='#020617' />
				<rect x='13.3334' y='12.2183' width='13.3333' height='3.33333' fill='#020617' />
				<rect x='6.66663' y='28.8853' width='16.6667' height='3.33333' fill='#EAB308' />
			</svg>

			<span className='min-w-0 flex-1'>
				<span className='block truncate font-heading text-sm font-extrabold leading-5 text-slate-950'>
					Quy tắc cộng đồng
				</span>
				<span className='block truncate text-xs font-semibold leading-5 text-slate-500'>
					Hãy tôn trọng lẫn nhau!
				</span>
			</span>

			<svg
				xmlns='http://www.w3.org/2000/svg'
				width='24'
				height='25'
				viewBox='0 0 24 25'
				fill='none'
				className='h-6 w-6 shrink-0 rotate-180'
				aria-hidden='true'>
				<path
					fillRule='evenodd'
					clipRule='evenodd'
					d='M16 5.55176L16 7.55176L14 7.55176L14 5.55176L16 5.55176ZM12 9.55176L12 7.55176L14 7.55176L14 9.55176L12 9.55176ZM10 11.5518L10 9.55176L12 9.55176L12 11.5518L10 11.5518ZM10 13.5518L8 13.5518L8 11.5518L10 11.5518L10 13.5518ZM12 15.5518L12 13.5518L10 13.5518L10 15.5518L12 15.5518ZM12 15.5518L14 15.5518L14 17.5518L12 17.5518L12 15.5518ZM16 19.5518L16 17.5518L14 17.5518L14 19.5518L16 19.5518Z'
					fill='#64748B'
				/>
			</svg>
		</Link>
	);
};

export default CommunityRulesCard;
