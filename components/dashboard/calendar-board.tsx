'use client'

import {
	daysBetween,
	formatShortDate,
	formatWeekday,
	getCalendarEvents,
	getMonthGrid,
	isSameDay,
	type CalendarEvent,
	type JobApplication,
} from '@/lib/applications'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { useMemo } from 'react'

const WEEKDAY_HEADERS=[ 'mon','tue','wed','thu','fri','sat','sun' ]

/** How far ahead the side list looks. */
export const LOOKAHEAD_DAYS=7

function eventTone ( event: CalendarEvent ): string {
	if ( event.kind==='overdue' ) return 'text-wn'
	if ( event.kind==='deadline' ) return 'text-ac'
	return 'text-dim'
}

interface CalendarBoardProps {
	applications: JobApplication[]
	/** The month on screen. */
	cursor: { year: number; month: number }|null
	/** Today, resolved on the client. Null until then. */
	now: Date|null
	isLoading?: boolean
}

/**
 * The month grid and the two lists beside it — what is coming, and what is
 * already late. Every mark on it comes from an application.
 */
export function CalendarBoard ( { applications,cursor,now,isLoading }: CalendarBoardProps ) {
	const router=useRouter()

	const events=useMemo(
		() => ( now? getCalendarEvents( applications,now ):[] ),
		[ applications,now ]
	)

	const days=useMemo(
		() => ( cursor? getMonthGrid( cursor.year,cursor.month ):[] ),
		[ cursor ]
	)

	const upcoming=useMemo( () => {
		if ( !now ) return []
		return events.filter( event => {
			const delta=daysBetween( now,event.date )
			return event.kind!=='applied'&&delta>=0&&delta<=LOOKAHEAD_DAYS
		} )
	},[ events,now ] )

	const overdue=useMemo(
		() => events.filter( event => event.kind==='overdue' ),
		[ events ]
	)

	const openApplication=( id: string ) => router.push( `/dashboard/applications?open=${id}` )

	return (
		<div className="mt-[26px] grid grid-cols-1 gap-[26px] lg:grid-cols-[minmax(0,1fr)_320px]">
			<div>
				<div className="label grid grid-cols-7 pb-[9px]">
					{WEEKDAY_HEADERS.map( day => <div key={day}>{day}</div> )}
				</div>

				<div className="grid grid-cols-7 border-l border-t border-br">
					{days.map( day => {
						const inMonth=cursor!==null&&day.getMonth()===cursor.month
						const isToday=now!==null&&isSameDay( day,now )
						const isWeekend=day.getDay()===0||day.getDay()===6
						const dayEvents=events.filter( event => isSameDay( event.date,day ) )

						return (
							<div
								key={day.toISOString()}
								className={cn(
									'h-[88px] overflow-hidden border-r border-b border-br px-2.5 py-[9px]',
									!inMonth&&'text-dim opacity-40',
									inMonth&&isWeekend&&'text-dim',
									isToday&&'bg-ft shadow-[inset_2px_0_0_var(--ac)]'
								)}
							>
								<span className={isToday? 'text-ac':undefined}>{day.getDate()}</span>

								{isToday&&<div className="mt-[7px] text-[11px] text-dim">today</div>}

								{dayEvents.slice( 0,isToday? 1:2 ).map( event => (
									<button
										key={event.id}
										type="button"
										onClick={() => openApplication( event.application.id )}
										className={cn(
											'mt-[7px] block w-full truncate text-left text-[11px] hover:underline',
											eventTone( event )
										)}
										title={event.label}
									>
										{event.label}
									</button>
								) )}
							</div>
						)
					} )}
				</div>
			</div>

			<div>
				<div className="text-[10.5px] uppercase tracking-[.12em] text-ac">
					next {LOOKAHEAD_DAYS} days
				</div>

				<div className="mt-3.5 flex flex-col">
					{isLoading? (
						Array.from( { length: 3 } ).map( ( _,i ) => (
							<div key={i} className="border-t border-br py-3.5">
								<div className="skeleton h-4 w-2/3" />
								<div className="skeleton mt-1.5 h-3 w-1/2" />
							</div>
						) )
					):upcoming.length===0? (
						<div className="border-t border-b border-br py-3.5 text-[12px] text-dim">
							Nothing scheduled in the next {LOOKAHEAD_DAYS} days.
						</div>
					):(
						upcoming.map( ( event,index ) => (
							<button
								key={event.id}
								type="button"
								onClick={() => openApplication( event.application.id )}
								className={cn(
									'border-t border-br py-3.5 text-left transition-colors hover:bg-ft',
									index===upcoming.length-1&&'border-b'
								)}
							>
								<div className="flex justify-between gap-3">
									<span className="display truncate text-[14px] text-fg">{event.label}</span>
									<span className="flex-none text-[12px] text-ac">
										{formatWeekday( event.date )}
									</span>
								</div>
								<div className="mt-1.5 text-[11.5px] text-dim">
									{event.application.position}
									{event.application.isRemote? ' · remote':''}
								</div>
							</button>
						) )
					)}
				</div>

				{overdue.length>0&&(
					<div className="panel-warn mt-[26px] px-4 py-[15px]">
						<div className="text-[10.5px] uppercase tracking-[.12em] text-wn">
							overdue — {overdue.length}
						</div>
						{overdue.slice( 0,1 ).map( event => (
							<div key={event.id}>
								<div className="display mt-2.5 text-[14px] text-fg">{event.label}</div>
								<div className="mt-1.5 text-[11.5px] text-dim">
									was due {formatShortDate( event.date )}
									{now? ` · ${Math.abs( daysBetween( now,event.date ) )} days ago`:''}
								</div>
								{/* No mail integration exists, so this opens the application
								    rather than claiming to send anything. */}
								<button
									type="button"
									onClick={() => openApplication( event.application.id )}
									className="mt-3.5 w-full border border-wn py-[11px] text-[12px] text-wn transition-colors hover:bg-wn hover:text-af"
								>
									open application
								</button>
							</div>
						) )}
					</div>
				)}
			</div>
		</div>
	)
}
