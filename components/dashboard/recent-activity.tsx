'use client'

// Database queries moved to API routes
import { useSession } from '@/lib/auth/client'
import { useEffect,useState } from 'react'

interface ActivityEvent {
	id: string
	type: string
	title: string
	description: string|null
	date: Date|string
	application: {
		position: string
		companyName: string
	}
}

const activityTypeColors={
	email: 'from-blue-900/50 to-purple-900/50',
	call: 'from-green-900/50 to-teal-900/50',
	interview: 'from-purple-900/50 to-pink-900/50',
	offer: 'from-green-900/50 to-emerald-900/50',
	rejection: 'from-red-900/50 to-pink-900/50',
	followup: 'from-orange-900/50 to-red-900/50'
}

const activityTypeDots={
	email: 'bg-blue-400',
	call: 'bg-green-400',
	interview: 'bg-purple-400',
	offer: 'bg-green-400',
	rejection: 'bg-red-400',
	followup: 'bg-orange-400'
}

const activityTypeBorders={
	email: 'border-l-blue-400',
	call: 'border-l-green-400',
	interview: 'border-l-purple-400',
	offer: 'border-l-green-400',
	rejection: 'border-l-red-400',
	followup: 'border-l-orange-400'
}

export function RecentActivity () {
	const { data: session }=useSession()
	const [ activities,setActivities ]=useState<ActivityEvent[]>( [] )
	const [ isLoading,setIsLoading ]=useState( true )

	useEffect( () => {
		async function fetchActivities () {
			if ( !session?.user?.id ) return

			try {
				const response=await fetch( '/api/dashboard/activity?limit=5' )
				if ( !response.ok ) {
					throw new Error( 'Failed to fetch activity' )
				}
				const activityData=await response.json()
				setActivities( activityData )
			} catch ( error ) {
				console.error( 'Error fetching recent activity:',error )
			} finally {
				setIsLoading( false )
			}
		}

		fetchActivities()
	},[ session?.user?.id ] )

	const formatDate=( date: Date|string ) => {
		// Convert string to Date if needed
		const dateObj=typeof date==='string'? new Date( date ):date

		// Check if date is valid
		if ( isNaN( dateObj.getTime() ) ) {
			return 'Invalid date'
		}

		const now=new Date()
		const diffTime=Math.abs( now.getTime()-dateObj.getTime() )
		const diffDays=Math.ceil( diffTime/( 1000*60*60*24 ) )

		if ( diffDays===0 ) return 'Today'
		if ( diffDays===1 ) return 'Yesterday'
		if ( diffDays<7 ) return `${diffDays} days ago`
		if ( diffDays<30 ) return `${Math.floor( diffDays/7 )} weeks ago`
		return dateObj.toLocaleDateString( 'en-US',{ month: 'short',day: 'numeric' } )
	}

	if ( isLoading ) {
		return (
			<div className="glass rounded-card p-6">
				<h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
				<div className="space-y-3">
					{Array.from( { length: 3 } ).map( ( _,i ) => (
						<div key={i} className="p-3 skeleton rounded-lg">
							<div className="h-4 skeleton rounded w-3/4"></div>
						</div>
					) )}
				</div>
			</div>
		)
	}

	if ( activities.length===0 ) {
		return (
			<div className="glass rounded-card p-6">
				<h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
				<div className="text-center py-4">
					<p className="text-violet-200/70 text-sm">No recent activity</p>
					<p className="text-violet-300/40 text-xs mt-1">Start tracking your applications to see activity here</p>
				</div>
			</div>
		)
	}

	return (
		<div className="glass rounded-card p-6">
			<h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
			<div className="space-y-3">
				{activities.map( ( activity ) => {
					const type=activity.type.toLowerCase() as keyof typeof activityTypeColors
					const bgColor=activityTypeColors[ type ]||'from-gray-900/50 to-gray-800/50'
					const dotColor=activityTypeDots[ type ]||'bg-gray-400'
					const borderColor=activityTypeBorders[ type ]||'border-l-gray-400'

					return (
						<div
							key={activity.id}
							className={`p-3 bg-gradient-to-r ${bgColor} rounded-lg border border-white/20 border-l-2 ${borderColor}`}
						>
							<div className="flex items-center space-x-3">
								<div className={`w-2 h-2 ${dotColor} rounded-full`}></div>
								<div className="flex-1">
									<span className="text-sm text-white font-medium">
										{activity.title}
									</span>
									{activity.description&&(
										<p className="text-xs text-violet-200/70 mt-1">
											{activity.description}
										</p>
									)}
									<div className="flex items-center justify-between mt-2">
										<span className="text-xs text-violet-200/70">
											{activity.application.position} at {activity.application.companyName}
										</span>
										<span className="text-xs text-violet-300/40">
											{formatDate( activity.date )}
										</span>
									</div>
								</div>
							</div>
						</div>
					)
				} )}
			</div>
		</div>
	)
}
