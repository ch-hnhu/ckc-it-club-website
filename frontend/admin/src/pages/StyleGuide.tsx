import { Card } from "../components/ui/card";

export default function StyleGuide() {
	const colors = [
		{ name: "Primary", hex: "#2e3820", description: "Dark Olive Green - Main brand color" },
		{ name: "Primary Light", hex: "#4a5630", description: "Lighter variant for hover states" },
		{ name: "Primary Dark", hex: "#1f2817", description: "Darker variant for active states" },
		{ name: "Black", hex: "#1a1a1a", description: "Text color, high contrast" },
		{ name: "Dark Gray", hex: "#666666", description: "Secondary text color" },
		{ name: "Light Gray", hex: "#e5e5e5", description: "Subtle backgrounds" },
		{ name: "Border", hex: "#e0e0e0", description: "Card and section borders" },
		{ name: "Background", hex: "#f5f5f5", description: "Light background" },
		{ name: "White", hex: "#ffffff", description: "Base background color" },
	];

	const typography = [
		{ level: "h1", size: "text-3xl", weight: "font-bold", example: "Dashboard" },
		{ level: "h2", size: "text-2xl", weight: "font-bold", example: "Section Title" },
		{ level: "h3", size: "text-lg", weight: "font-bold", example: "Card Title" },
		{ level: "body", size: "text-base", weight: "font-normal", example: "Regular text content" },
		{ level: "small", size: "text-sm", weight: "font-normal", example: "Secondary text" },
		{ level: "xs", size: "text-xs", weight: "font-normal", example: "Extra small text" },
	];

	const spacing = [
		{ name: "xs", value: "4px (0.25rem)", class: "p-1" },
		{ name: "sm", value: "8px (0.5rem)", class: "p-2" },
		{ name: "md", value: "16px (1rem)", class: "p-4" },
		{ name: "lg", value: "24px (1.5rem)", class: "p-6" },
		{ name: "xl", value: "32px (2rem)", class: "p-8" },
		{ name: "2xl", value: "48px (3rem)", class: "p-12" },
	];

	return (
		<main className='flex-1 overflow-auto bg-white dark:bg-zinc-950 p-6'>
			<div className='max-w-6xl mx-auto space-y-8'>
				{/* Header */}
				<div className='border-b border-[#e0e0e0] dark:border-zinc-800 pb-6'>
					<h1 className='text-4xl font-bold text-[#1a1a1a] dark:text-zinc-100 mb-2'>Design System</h1>
					<p className='text-[#666666] dark:text-zinc-400'>
						Visual guide for the CKC IT CLUB Dashboard
					</p>
				</div>

				{/* Colors Section */}
				<section>
					<h2 className='text-2xl font-bold text-[#1a1a1a] dark:text-zinc-100 mb-6'>Color Palette</h2>
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
						{colors.map((color) => (
							<Card key={color.hex} className='border border-[#e0e0e0] dark:border-zinc-800 p-4'>
								<div
									className='w-full h-24 rounded-lg mb-4 border border-[#e0e0e0] dark:border-zinc-800'
									style={{ backgroundColor: color.hex }}
								/>
								<h3 className='font-bold text-[#1a1a1a] dark:text-zinc-100'>{color.name}</h3>
								<p className='text-sm text-[#666666] dark:text-zinc-400 font-mono'>{color.hex}</p>
								<p className='text-xs text-[#999999] dark:text-zinc-500 mt-2'>{color.description}</p>
							</Card>
						))}
					</div>
				</section>

				{/* Typography Section */}
				<section>
					<h2 className='text-2xl font-bold text-[#1a1a1a] dark:text-zinc-100 mb-6'>Typography</h2>
					<Card className='border border-[#e0e0e0] dark:border-zinc-800 p-6 space-y-6'>
						{typography.map((type) => (
							<div key={type.level} className='pb-4 border-b border-[#e5e5e5] dark:border-zinc-800 last:border-0 last:pb-0'>
								<div className='flex items-baseline justify-between mb-2'>
									<code className='text-sm font-mono text-[#2e3820] dark:text-zinc-200'>
										{type.level}
									</code>
									<span className='text-xs text-[#999999] dark:text-zinc-500'>
										{type.size} • {type.weight}
									</span>
								</div>
								<div className={`${type.size} ${type.weight} text-[#1a1a1a] dark:text-zinc-100`}>
									{type.example}
								</div>
							</div>
						))}
					</Card>
				</section>

				{/* Spacing Section */}
				<section>
					<h2 className='text-2xl font-bold text-[#1a1a1a] dark:text-zinc-100 mb-6'>Spacing Scale</h2>
					<Card className='border border-[#e0e0e0] dark:border-zinc-800 p-6'>
						<div className='space-y-4'>
							{spacing.map((space) => (
								<div key={space.name} className='flex items-center gap-4'>
									<div className='w-24'>
										<code className='text-sm font-mono text-[#2e3820] dark:text-zinc-200'>
											{space.name}
										</code>
									</div>
									<div
										className='bg-[#2e3820] dark:bg-zinc-800 rounded'
										style={{
											width: `${parseInt(space.value.split("px")[0]) * 2}px`,
											height: "24px",
										}}
									/>
									<span className='text-sm text-[#666666] dark:text-zinc-400'>{space.value}</span>
									<span className='text-xs text-[#999999] dark:text-zinc-500'>{space.class}</span>
								</div>
							))}
						</div>
					</Card>
				</section>

				{/* Components Section */}
				<section>
					<h2 className='text-2xl font-bold text-[#1a1a1a] dark:text-zinc-100 mb-6'>Component States</h2>
					<div className='space-y-4'>
						{/* Button States */}
						<div>
							<h3 className='text-lg font-bold text-[#1a1a1a] dark:text-zinc-100 mb-3'>Buttons</h3>
							<div className='flex gap-3 flex-wrap'>
								<button className='px-4 py-2 bg-[#2e3820] dark:bg-zinc-800 text-white rounded-lg hover:bg-[#1f2817] transition-colors'>
									Primary
								</button>
								<button className='px-4 py-2 border border-[#e0e0e0] dark:border-zinc-800 text-[#1a1a1a] dark:text-zinc-100 rounded-lg hover:bg-[#f5f5f5] dark:bg-zinc-900 transition-colors'>
									Secondary
								</button>
								<button className='px-4 py-2 bg-[#e5e5e5] dark:bg-zinc-800 text-[#1a1a1a] dark:text-zinc-100 rounded-lg hover:bg-[#e0e0e0] transition-colors disabled:opacity-50'>
									Disabled
								</button>
							</div>
						</div>

						{/* Card States */}
						<div>
							<h3 className='text-lg font-bold text-[#1a1a1a] dark:text-zinc-100 mb-3'>Cards</h3>
							<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
								<Card className='border border-[#e0e0e0] dark:border-zinc-800 p-4 hover:shadow-md transition-shadow'>
									<p className='font-bold text-[#1a1a1a] dark:text-zinc-100'>Default Card</p>
									<p className='text-sm text-[#666666] dark:text-zinc-400'>With subtle shadow on hover</p>
								</Card>
								<Card className='border-2 border-[#2e3820] p-4'>
									<p className='font-bold text-[#2e3820] dark:text-zinc-200'>Active Card</p>
									<p className='text-sm text-[#666666] dark:text-zinc-400'>With primary color border</p>
								</Card>
							</div>
						</div>

						{/* Input States */}
						<div>
							<h3 className='text-lg font-bold text-[#1a1a1a] dark:text-zinc-100 mb-3'>Form Inputs</h3>
							<div className='space-y-3'>
								<input
									type='text'
									placeholder='Default input'
									className='w-full px-3 py-2 border border-[#e0e0e0] dark:border-zinc-800 rounded-lg focus:outline-none focus:border-[#2e3820] transition-colors'
								/>
								<input
									type='text'
									placeholder='Focused input'
									className='w-full px-3 py-2 border-2 border-[#2e3820] rounded-lg focus:outline-none'
									defaultValue='Focused state'
								/>
								<input
									type='text'
									placeholder='Disabled input'
									disabled
									className='w-full px-3 py-2 border border-[#e0e0e0] dark:border-zinc-800 rounded-lg bg-[#f5f5f5] dark:bg-zinc-900 opacity-50 cursor-not-allowed'
								/>
							</div>
						</div>
					</div>
				</section>

				{/* Design Tokens */}
				<section>
					<h2 className='text-2xl font-bold text-[#1a1a1a] dark:text-zinc-100 mb-6'>CSS Variables</h2>
					<Card className='border border-[#e0e0e0] dark:border-zinc-800 p-6'>
						<div className='font-mono text-sm space-y-2 text-[#1a1a1a] dark:text-zinc-100'>
							<p>--primary: #2e3820</p>
							<p>--foreground: #1a1a1a</p>
							<p>--background: #ffffff</p>
							<p>--border: #e0e0e0</p>
							<p>--muted: #e5e5e5</p>
							<p>--muted-foreground: #666666</p>
						</div>
					</Card>
				</section>

				{/* Grid Sizes */}
				<section>
					<h2 className='text-2xl font-bold text-[#1a1a1a] dark:text-zinc-100 mb-6'>Responsive Grid</h2>
					<Card className='border border-[#e0e0e0] dark:border-zinc-800 p-6'>
						<p className='text-[#666666] dark:text-zinc-400 mb-4'>Breakpoints (Tailwind):</p>
						<div className='space-y-2 font-mono text-sm'>
							<p><code className='text-[#2e3820] dark:text-zinc-200'>sm:</code> 640px</p>
							<p><code className='text-[#2e3820] dark:text-zinc-200'>md:</code> 768px</p>
							<p><code className='text-[#2e3820] dark:text-zinc-200'>lg:</code> 1024px</p>
							<p><code className='text-[#2e3820] dark:text-zinc-200'>xl:</code> 1280px</p>
						</div>
					</Card>
				</section>
			</div>
		</main>
	);
}
