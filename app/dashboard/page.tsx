'use client'

import { ActionQueue } from '@/components/dashboard/action-queue'
import { AddApplicationButton } from '@/components/dashboard/add-application-button'
import { DashboardHeader } from '@/components/dashboard/header'
import { PipelineTable } from '@/components/dashboard/pipeline-table'
import { DashboardStats } from '@/components/dashboard/stats'
import { useApplications } from '@/hooks/use-applications'
import {
	getActionQueue,
	getPipelineHeadline,
	getPipelineStats,
} from '@/lib/applications'
import { useEffect,useState } from 'react'

const MONTHS=[ 'jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec' ]

export default function DashboardPage () {
	const { applications,isLoading,error,refresh }=useApplications()
	const [ isAddOpen,setIsAddOpen ]=useState( false )
	const [ now,setNow ]=useState<Date|null>( null )

	// Resolved on the client so the server render cannot disagree about "today".
	useEffect( () => {
		setNow( new Date() )
	},[] )

	useEffect( () => {
		const onKeyDown=( event: KeyboardEvent ) => {
			if ( event.metaKey||event.ctrlKey||event.altKey ) return
			if ( event.key!=='n'&&event.key!=='N' ) return

			const target=event.target as HTMLElement|null
			if ( target?.isContentEditable ) return
			if ( target&&/^(INPUT|TEXTAREA|SELECT)$/.test( target.tagName ) ) return

			event.preventDefault()
			setIsAddOpen( true )
		}

		window.addEventListener( 'keydown',onKeyDown )
		return () => window.removeEventListener( 'keydown',onKeyDown )
	},[] )

	const stats=getPipelineStats( applications )
	const queue=now? getActionQueue( applications,now ):[]
	const period=now? `${MONTHS[ now.getMonth() ]} ${now.getFullYear()}`:''

	return (
		<div>
			<DashboardHeader
				eyebrow={`pipeline${period? ` / ${period}`:''}`}
				title={isLoading? 'Loading pipeline':getPipelineHeadline( stats,queue.length )}
				action={
					<AddApplicationButton
						open={isAddOpen}
						onOpenChange={setIsAddOpen}
						onApplicationAdded={refresh}
						shortcut="N"
					/>
				}
			/>

			{error&&(
				<div className="panel-warn mt-5 px-5 py-4 text-[12.5px] text-wn">{error}</div>
			)}

			<DashboardStats applications={applications} isLoading={isLoading} />

			<ActionQueue items={queue} />

			<PipelineTable applications={applications} isLoading={isLoading} />
		</div>
	)
}
