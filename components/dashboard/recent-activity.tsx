'use client'

import { formatShortDate } from '@/lib/applications'
import { useEffect,useState } from 'react'

interface ActivityEvent {
	id: string
	type: string
	title: string
	description: string|null
	date: string
	application: {
		position: string
		companyName: string
	}
}

interface RecentActivityProps {
	limit?: number
}

/** The last few things that happened, dated in the left column. */
export function RecentActivity ( { limit=5 }: RecentActivityProps ) {
	const [ events,setEvents ]=useState<ActivityEvent[]|null>( null )

	useEffect( () => {
		let cancelled=false

		fetch( `/api/dashboard/activity?limit=${limit}` )
			.then( response => ( response.ok? response.json():[] ) )
			.then( data => {
				if ( !cancelled ) setEvents( Array.isArray( data )? data:[] )
			} )
			.catch( error => {
				console.error( 'Error fetching activity:',error )
				if ( !cancelled ) setEvents( [] )
			} )

		return () => {
			cancelled=true
		}
	},[ limit ] )

	return (
		<div className="mt-7 border border-br px-5 py-[18px]">
			<div className="text-[10.5px] uppercase tracking-[.12em] text-dim">recent activity</div>

			<div className="mt-3.5 flex flex-col gap-[11px] text-[12.5px]">
				{events===null? (
					Array.from( { length: 4 } ).map( ( _,i ) => (
						<div key={i} className="skeleton h-3.5 w-2/3" />
					) )
				):events.length===0? (
					<span className="text-dim">Nothing logged yet.</span>
				):(
					events.map( event => (
						<div key={event.id} className="flex gap-4">
							<span className="w-16 flex-none text-dim">{formatShortDate( event.date )}</span>
							<span className="truncate">
								{event.title}
								<span className="text-dim">
									{' '}— {event.application.companyName}
								</span>
							</span>
						</div>
					) )
				)}
			</div>
		</div>
	)
}
