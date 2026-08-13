import { BrandMark } from '@/components/ui/brand-mark'
import Link from 'next/link'

/** The pipeline sample in the hero — the product's own shape, shown not described. */
const previewRows=[
	{ role: 'Staff Frontend Engineer',company: 'overstory',stage: 'interview',stageTone: 'ac',applied: 'aug 04',next: 'onsite thu',nextTone: 'fg' },
	{ role: 'Frontend Engineer',company: 'cassava',stage: 'offer',stageTone: 'ac',applied: 'jul 12',next: 'expires fri',nextTone: 'ac' },
	{ role: 'Senior Product Engineer',company: 'meridian health',stage: 'screening',stageTone: 'dim',applied: 'jul 29',next: 'follow up 6d',nextTone: 'wn' },
]

const features=[
	[ 'Application Tracking','Keep track of all your job applications in one place with detailed status updates.' ],
	[ 'Company Management','Store company information, logos, and details for easy reference.' ],
	[ 'Progress Tracking','Monitor your application progress from applied to offer with visual indicators.' ],
	[ 'Task Management','Set reminders and track follow-up tasks to stay on top of your applications.' ],
	[ 'Team Collaboration','Share your progress with mentors or career coaches for guidance.' ],
	[ 'Quick Actions','Fast access to common tasks and quick application entry.' ],
]

const toneClass: Record<string,string>={ ac: 'text-ac',dim: 'text-dim',wn: 'text-wn',fg: 'text-fg' }

const PREVIEW_COLUMNS='grid-cols-[1fr_120px_96px_130px]'

export default function HomePage () {
	return (
		<div className="min-h-screen bg-bg text-fg">
			<header className="flex items-center justify-between border-b border-br px-10 py-5">
				<div className="flex items-center gap-2.5">
					<BrandMark />
					<span className="font-medium tracking-[.02em]">codeniwork</span>
				</div>
				<div className="flex items-center gap-[22px]">
					<Link href="/auth/signin" className="text-[12.5px] text-dim no-underline transition-colors hover:text-fg">
						sign in
					</Link>
					<Link href="/auth/signup" className="bg-ac px-4 py-[9px] text-[12.5px] text-af no-underline transition-colors hover:bg-ac-deep">
						get started
					</Link>
				</div>
			</header>

			<section className="border-b border-br px-10 pt-[78px] pb-[70px]">
				<div className="text-[11px] uppercase tracking-[.16em] text-dim">job application tracker</div>
				<h1 className="mt-[22px] max-w-[760px] font-display text-[52px] font-extralight leading-[1.08] tracking-[-.025em]">
					Track Your Career with CodeniWork
				</h1>
				<p className="mt-6 max-w-[560px] text-[14px] leading-[1.75] text-dim">
					Organize your job search, track applications, and never miss a follow-up. Built with a
					clean, intuitive interface inspired by modern design principles.
				</p>
				<div className="mt-[34px] flex flex-wrap gap-3">
					<Link href="/auth/signup" className="bg-ac px-[22px] py-[15px] text-[13px] text-af no-underline transition-colors hover:bg-ac-deep">
						Start Tracking Now
					</Link>
					<Link href="/auth/signin" className="border border-br px-[22px] py-[15px] text-[13px] text-fg no-underline transition-colors hover:border-ac hover:text-ac">
						Sign In
					</Link>
				</div>

				<div className="mt-[54px] overflow-x-auto border border-br bg-pn">
					<div className="min-w-[620px]">
						<div className="flex gap-2 border-b border-br px-[18px] py-3 text-[11px] text-dim">
							<span>pipeline</span>
							<span className="ml-auto">12 open · 3 need you</span>
						</div>
						{previewRows.map( ( row,index ) => (
							<div
								key={row.company}
								className={`grid ${PREVIEW_COLUMNS} items-center px-[18px] py-[15px] ${
									index<previewRows.length-1? 'border-b border-ft':''
								}`}
							>
								<span className="display text-[14px]">
									{row.role}
									<span className="font-mono text-[12.5px] text-dim">&nbsp;&nbsp;{row.company}</span>
								</span>
								<span className={`text-[12.5px] ${toneClass[ row.stageTone ]}`}>{row.stage}</span>
								<span className="text-[12.5px] text-dim">{row.applied}</span>
								<span className={`text-[12.5px] ${toneClass[ row.nextTone ]}`}>{row.next}</span>
							</div>
						) )}
					</div>
				</div>
			</section>

			<section className="border-b border-br px-10 pt-[70px] pb-[66px]">
				<h2 className="max-w-[600px] font-display text-[32px] font-extralight tracking-[-.02em]">
					Everything you need to manage your job search
				</h2>
				<div className="mt-11 grid grid-cols-1 border-t border-l border-br sm:grid-cols-2 lg:grid-cols-3">
					{features.map( ( [ title,description ],index ) => (
						<div key={title} className="border-r border-b border-br px-[26px] py-7">
							<div className="text-[11px] text-ac">{String( index+1 ).padStart( 2,'0' )}</div>
							<h3 className="mt-4 font-display text-[17px] font-normal">{title}</h3>
							<p className="mt-[11px] text-[12.5px] leading-[1.7] text-dim">{description}</p>
						</div>
					) )}
				</div>
			</section>

			<section className="flex flex-col items-start justify-between gap-10 border-b border-br px-10 py-[66px] lg:flex-row lg:items-end">
				<div>
					<h2 className="font-display text-[30px] font-extralight tracking-[-.02em]">
						Ready to take control of your job search?
					</h2>
					<p className="mt-4 max-w-[520px] text-[13px] leading-[1.7] text-dim">
						Join thousands of job seekers who are already using CodeniWork to organize their
						applications.
					</p>
				</div>
				<Link href="/auth/signup" className="flex-none bg-ac px-[22px] py-[15px] text-[13px] text-af no-underline transition-colors hover:bg-ac-deep">
					Get Started Free
				</Link>
			</section>

			<footer className="flex flex-col justify-between gap-10 px-10 pt-[34px] pb-[30px] sm:flex-row sm:items-start">
				<div>
					<div className="flex items-center gap-2.5">
						<BrandMark />
						<span className="font-medium">codeniwork</span>
					</div>
					<p className="mt-3.5 max-w-[340px] text-[12.5px] leading-[1.7] text-dim">
						Organize your job search, track applications, and land your dream job.
					</p>
				</div>
				<div className="text-[11.5px] leading-[2] text-dim sm:text-right">
					<div>© 2026 CodeniWork. All rights reserved.</div>
					<div>
						Made with love by{' '}
						<a href="https://tioye.dev" className="text-ac no-underline hover:underline">
							CodenificienT
						</a>
					</div>
				</div>
			</footer>
		</div>
	)
}
