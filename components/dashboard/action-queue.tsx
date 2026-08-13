'use client'

import type { ActionItem } from '@/lib/applications'

interface ActionQueueProps {
	items: ActionItem[]
}

/**
 * The three things actually waiting on the user. Nothing here is a summary —
 * every line is a decision or a message that has not been sent.
 */
export function ActionQueue ( { items }: ActionQueueProps ) {
	if ( items.length===0 ) return null

	return (
		<div className="panel-accent mt-5 px-5 py-[17px]">
			<div className="text-[10.5px] uppercase tracking-[.12em] text-ac">
				action queue — {items.length}
			</div>
			<div className="mt-[13px] flex flex-col gap-[9px] text-[13px]">
				{items.map( item => (
					<div key={item.id} className="flex items-center gap-4">
						<span className={`w-[54px] flex-none ${item.tone==='warn'? 'text-wn':'text-ac'}`}>
							{item.when}
						</span>
						<span className="flex-1 truncate text-fg">{item.text}</span>
						<span className="flex-none text-dim">{item.relative}</span>
					</div>
				) )}
			</div>
		</div>
	)
}
