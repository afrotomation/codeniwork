'use client'

import { CalendarBoard } from '@/components/dashboard/calendar-board'
import { DashboardHeader } from '@/components/dashboard/header'
import { useApplications } from '@/hooks/use-applications'
import { useCallback,useEffect,useState } from 'react'

const MONTH_NAMES=[
	'January','February','March','April','May','June',
	'July','August','September','October','November','December',
]

export default function CalendarPage () {
	const { applications,isLoading,error }=useApplications()

	const [ now,setNow ]=useState<Date|null>( null )
	const [ cursor,setCursor ]=useState<{ year: number; month: number }|null>( null )

	// "Today" is only knowable on the client; render the grid once it is.
	useEffect( () => {
		const today=new Date()
		setNow( today )
		setCursor( { year: today.getFullYear(),month: today.getMonth() } )
	},[] )

	const step=useCallback( ( delta: number ) => {
		setCursor( current => {
			if ( !current ) return current
			const next=new Date( current.year,current.month+delta,1 )
			return { year: next.getFullYear(),month: next.getMonth() }
		} )
	},[] )

	const goToday=useCallback( () => {
		const today=new Date()
		setCursor( { year: today.getFullYear(),month: today.getMonth() } )
	},[] )

	useEffect( () => {
		const onKeyDown=( event: KeyboardEvent ) => {
			if ( event.metaKey||event.ctrlKey||event.altKey ) return

			const target=event.target as HTMLElement|null
			if ( target?.isContentEditable ) return
			if ( target&&/^(INPUT|TEXTAREA|SELECT)$/.test( target.tagName ) ) return

			if ( event.key==='ArrowLeft' ) {
				event.preventDefault()
				step( -1 )
			} else if ( event.key==='ArrowRight' ) {
				event.preventDefault()
				step( 1 )
			} else if ( event.key==='t'||event.key==='T' ) {
				event.preventDefault()
				goToday()
			}
		}

		window.addEventListener( 'keydown',onKeyDown )
		return () => window.removeEventListener( 'keydown',onKeyDown )
	},[ step,goToday ] )

	return (
		<div>
			<DashboardHeader
				eyebrow="calendar"
				title={cursor? `${MONTH_NAMES[ cursor.month ]} ${cursor.year}`:'Calendar'}
				align="end"
				action={
					<div className="flex gap-2">
						<button
							type="button"
							onClick={() => step( -1 )}
							aria-label="Previous month"
							className="border border-br px-3.5 py-[9px] text-[12px] text-dim transition-colors hover:border-ac hover:text-ac"
						>
							←
						</button>
						<button
							type="button"
							onClick={goToday}
							className="border border-br px-3.5 py-[9px] text-[12px] text-fg transition-colors hover:border-ac hover:text-ac"
						>
							today
						</button>
						<button
							type="button"
							onClick={() => step( 1 )}
							aria-label="Next month"
							className="border border-br px-3.5 py-[9px] text-[12px] text-dim transition-colors hover:border-ac hover:text-ac"
						>
							→
						</button>
					</div>
				}
			/>

			{error&&(
				<div className="panel-warn mt-5 px-5 py-4 text-[12.5px] text-wn">{error}</div>
			)}

			<CalendarBoard
				applications={applications}
				cursor={cursor}
				now={now}
				isLoading={isLoading}
			/>
		</div>
	)
}
