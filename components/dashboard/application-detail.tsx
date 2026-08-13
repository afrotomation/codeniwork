'use client'

import { Button } from '@/components/ui/button'
import {
	formatShortDate,
	type ApplicationEvent,
	type JobApplication,
} from '@/lib/applications'
import { useEffect,useState } from 'react'

interface ApplicationDetailProps {
	application: JobApplication
	onEdit: () => void
	onStatusChange: ( status: 'offer'|'rejected'|'withdrawn' ) => void
}

/**
 * The half of a row that only appears when it is opened: how the application
 * got here, what was noted about it, and what can be done about it now.
 */
export function ApplicationDetail ( { application,onEdit,onStatusChange }: ApplicationDetailProps ) {
	const [ events,setEvents ]=useState<ApplicationEvent[]|null>( null )

	useEffect( () => {
		let cancelled=false

		async function load () {
			try {
				const response=await fetch( `/api/dashboard/applications/${application.id}` )
				if ( !response.ok ) throw new Error( 'Failed to fetch timeline' )
				const data=await response.json()
				if ( !cancelled ) setEvents( data.events??[] )
			} catch ( error ) {
				console.error( 'Error fetching application timeline:',error )
				if ( !cancelled ) setEvents( [] )
			}
		}

		setEvents( null )
		load()

		return () => {
			cancelled=true
		}
	},[ application.id ] )

	// The application itself is the first thing that ever happened to it.
	const timeline=[
		{ id: 'applied',date: application.appliedAt,title: 'applied' },
		...( events??[] ).map( event => ( {
			id: event.id,
			date: event.date,
			title: event.title.toLowerCase(),
		} ) ),
	]

	const isOffer=application.status==='offer'

	return (
		<div className="grid grid-cols-1 gap-6 pb-5 lg:grid-cols-2">
			<div>
				<div className="label">timeline</div>
				<div className="mt-3 flex flex-col gap-2 text-[12.5px]">
					{events===null? (
						Array.from( { length: 3 } ).map( ( _,i ) => (
							<div key={i} className="skeleton h-3.5 w-2/3" />
						) )
					):(
						timeline.map( ( entry,index ) => {
							const isLatest=index===timeline.length-1&&timeline.length>1
							return (
								<div key={entry.id} className="flex gap-3.5">
									<span className={`w-[52px] flex-none ${isLatest? 'text-ac':'text-dim'}`}>
										{formatShortDate( entry.date )}
									</span>
									<span className="text-fg">{entry.title}</span>
								</div>
							)
						} )
					)}
				</div>
			</div>

			<div>
				<div className="label">notes</div>
				<div className="mt-3 text-[12.5px] leading-[1.75] text-dim">
					{application.notes||'No notes on this application yet.'}
				</div>

				<div className="mt-4 flex flex-wrap gap-2.5">
					{/* The design also shows "accept" here. There is no state in
					    application_status that represents an accepted offer, so it
					    is left out rather than mapped onto something it is not. */}
					{isOffer&&(
						<Button size="sm" variant="outline" onClick={() => onStatusChange( 'rejected' )}>
							decline
						</Button>
					)}
					<Button size="sm" variant="ghost" className="border border-br" onClick={onEdit}>
						edit
					</Button>
					{application.jobUrl&&(
						<Button
							size="sm"
							variant="ghost"
							className="border border-br"
							onClick={() => window.open( application.jobUrl!,'_blank','noopener,noreferrer' )}
						>
							posting
						</Button>
					)}
				</div>
			</div>
		</div>
	)
}
