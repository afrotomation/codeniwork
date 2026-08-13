import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface DashboardHeaderProps {
	/** Small uppercase line above the title — the route's own name. */
	eyebrow?: string
	title?: string
	/** Primary action for the screen, right-aligned against the title. */
	action?: ReactNode
	/**
	 * Titles that wrap read better aligned to the top; a single-line title
	 * beside a control cluster reads better aligned to the baseline.
	 */
	align?: 'start'|'end'
}

/**
 * The console has no top bar — identity and search live in the sidebar, so a
 * screen's header is just its name and its one action.
 */
export function DashboardHeader ( {
	eyebrow,
	title,
	action,
	align='start',
}: DashboardHeaderProps ) {
	if ( !title&&!eyebrow&&!action ) return null

	return (
		<div
			className={cn(
				'flex justify-between gap-6',
				align==='end'? 'items-end':'items-start'
			)}
		>
			<div>
				{eyebrow&&<div className="eyebrow">{eyebrow}</div>}
				{title&&(
					<h1 className="display mt-3 text-[31px] leading-tight text-fg">
						{title}
					</h1>
				)}
			</div>
			{action&&<div className="flex-none">{action}</div>}
		</div>
	)
}
