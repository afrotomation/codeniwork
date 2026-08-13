'use client'

import { AddApplicationButton } from '@/components/dashboard/add-application-button'
import { DashboardHeader } from '@/components/dashboard/header'
import { JobApplicationsList } from '@/components/dashboard/job-applications-list'
import { useApplications } from '@/hooks/use-applications'
import { Suspense,useEffect,useState } from 'react'

function ApplicationsScreen () {
	const { applications,isLoading,error,refresh }=useApplications()
	const [ isAddOpen,setIsAddOpen ]=useState( false )

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

	return (
		<div>
			<DashboardHeader
				eyebrow="applications"
				title={isLoading? 'Loading applications':`All ${applications.length} applications`}
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

			<JobApplicationsList
				applications={applications}
				isLoading={isLoading}
				onRefresh={refresh}
			/>
		</div>
	)
}

export default function ApplicationsPage () {
	return (
		<Suspense fallback={<div className="skeleton mt-6 h-[45px] w-full" />}>
			<ApplicationsScreen />
		</Suspense>
	)
}
