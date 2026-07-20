import React from "react";
import { Link } from "react-router-dom";

const AccessGate: React.FC<{
	icon: React.ElementType;
	title: string;
	message: string;
	action: { to: string; label: string };
}> = ({ icon: Icon, title, message, action }) => (
	<div className='neo-container px-6 pt-8'>
		<div className='mx-auto max-w-xl rounded-2xl border-2 border-black bg-white px-6 py-16 text-center shadow-[4px_4px_0_#111]'>
			<Icon className='mx-auto h-10 w-10 text-gray-300' />
			<p className='mt-4 font-heading text-xl font-extrabold text-black'>{title}</p>
			<p className='mt-2 text-sm text-gray-600'>{message}</p>
			<Link
				to={action.to}
				className='mt-6 inline-flex items-center gap-2 rounded-xl border-2 border-black bg-[var(--color-primary)] px-5 py-2.5 font-heading text-sm font-extrabold text-black shadow-[3px_3px_0_#111] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'>
				{action.label}
			</Link>
		</div>
	</div>
);

export default AccessGate;
