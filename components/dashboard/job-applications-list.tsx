'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card,CardContent } from '@/components/ui/card'
import { EditApplicationDialog } from './edit-application-dialog'
// Database queries moved to API routes
import {
	AlertCircle,
	Building2,
	Calendar,
	CheckCircle,
	Clock,
	Edit,
	ExternalLink,
	MapPin,
	Star,
	Trash2,
	XCircle
} from 'lucide-react'
import { useSession } from '@/lib/auth/client'
import { useEffect,useState } from 'react'

interface JobApplication {
	id: string
	position: string
	status: string
	priority: string|null
	salary: string|null
	location: string|null
	jobUrl: string|null
	notes: string|null
	appliedAt: Date|string
	deadline: Date|string|null
	isRemote: boolean|null
	company: {
		id: string
		name: string
		logo: string|null
		website: string|null
	}
}

const statusConfig={
	applied: { label: 'Applied',color: 'bg-blue-500 text-white',icon: Clock },
	screening: { label: 'Screening',color: 'bg-yellow-500 text-white',icon: AlertCircle },
	interview: { label: 'Interview',color: 'bg-purple-500 text-white',icon: Calendar },
	offer: { label: 'Offer',color: 'bg-green-500 text-white',icon: CheckCircle },
	rejected: { label: 'Rejected',color: 'bg-red-500 text-white',icon: XCircle },
	withdrawn: { label: 'Withdrawn',color: 'bg-gray-500 text-white',icon: XCircle }
}

const priorityConfig={
	low: { label: 'Low',color: 'bg-gray-500 text-white' },
	medium: { label: 'Medium',color: 'bg-orange-500 text-white' },
	high: { label: 'High',color: 'bg-red-500 text-white' }
}

export function JobApplicationsList () {
	const { data: session }=useSession()
	const [ applications,setApplications ]=useState<JobApplication[]>( [] )
	const [ isLoading,setIsLoading ]=useState( true )
	const [ editingApplication,setEditingApplication ]=useState<JobApplication|null>( null )
	const [ isEditDialogOpen,setIsEditDialogOpen ]=useState( false )

	useEffect( () => {
		if ( !session?.user?.id ) return

		fetchApplications().finally( () => {
			setIsLoading( false )
		} )
	},[ session?.user?.id ] )

	const formatDate=( date: Date|string ) => {
		// Convert string to Date if needed
		const dateObj=typeof date==='string'? new Date( date ):date

		// Check if date is valid
		if ( isNaN( dateObj.getTime() ) ) {
			return 'Invalid date'
		}

		return dateObj.toLocaleDateString( 'en-US',{
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		} )
	}

	const handleEditApplication=( application: JobApplication ) => {
		setEditingApplication( application )
		setIsEditDialogOpen( true )
	}

	const handleApplicationUpdated=async () => {
		// Refresh the applications list with loading state
		if ( session?.user?.id ) {
			try {
				// Set a brief loading state for better UX
				setIsLoading( true )

				// Add a small delay to show the loading state
				await new Promise( resolve => setTimeout( resolve,500 ) )

				await fetchApplications()

				// Show success feedback
				console.log( 'Applications list refreshed successfully' )
			} catch ( error ) {
				console.error( 'Error refreshing applications:',error )
				// Optionally show error toast here if needed
			} finally {
				setIsLoading( false )
			}
		}
	}

	const fetchApplications=async () => {
		try {
			const response=await fetch( '/api/dashboard/applications' )
			if ( !response.ok ) {
				throw new Error( 'Failed to fetch applications' )
			}
			const apps=await response.json()
			setApplications( apps )
		} catch ( error ) {
			console.error( 'Error fetching job applications:',error )
		}
	}

	if ( isLoading ) {
		return (
			<div className="space-y-4">
				{Array.from( { length: 3 } ).map( ( _,i ) => (
					<Card key={i} className="glass">
						<CardContent className="p-6">
							<div className="flex items-start space-x-4">
								<div className="w-16 h-16 skeleton rounded-xl"></div>
								<div className="flex-1 space-y-3">
									<div className="h-6 skeleton rounded w-3/4"></div>
									<div className="h-4 skeleton rounded w-1/2"></div>
									<div className="h-4 skeleton rounded w-2/3"></div>
								</div>
							</div>
						</CardContent>
					</Card>
				) )}
			</div>
		)
	}

	if ( applications.length===0 ) {
		return (
			<div className="text-center py-12">
				<Building2 className="w-16 h-16 text-violet-300/40 mx-auto mb-4" />
				<h3 className="text-lg font-medium text-white mb-2">No applications yet</h3>
				<p className="text-violet-200/70">Start tracking your job search by adding your first application.</p>
			</div>
		)
	}

	return (
		<>
			<div className="space-y-4">
				{applications.map( ( app ) => {
					const status=statusConfig[ app.status as keyof typeof statusConfig ]
					const priority=app.priority? priorityConfig[ app.priority as keyof typeof priorityConfig ]:null
					const StatusIcon=status.icon

					return (
						<Card
							key={app.id}
							className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 glass-interactive"
						>
							<CardContent className="p-6">
								<div className="flex items-start justify-between">
									<div className="flex items-start space-x-4 flex-1">
										{/* Company Logo */}
										<div className="w-16 h-16 rounded-xl bg-white/[0.06] flex items-center justify-center border border-white/[0.08]">
											{app.company.logo? (
												<img
													src={app.company.logo}
													alt={`${app.company.name} logo`}
													className="w-10 h-10 rounded-lg"
													onError={( e ) => {
														const target=e.target as HTMLImageElement
														target.style.display='none'
														target.nextElementSibling?.classList.remove( 'hidden' )
													}}
												/>
											):null}
											<Building2 className="w-8 h-8 text-violet-300/50 hidden" />
										</div>

										{/* Application Details */}
										<div className="flex-1 space-y-3">
											<div className="flex items-start justify-between">
												<div>
													<h3 className="text-xl font-semibold text-white group-hover:text-violet-300 transition-colors">
														{app.position}
													</h3>
													<div className="flex items-center space-x-2 mt-1">
														<Building2 className="w-4 h-4 text-violet-300/50" />
														<span className="text-lg font-medium text-violet-200/80">
															{app.company.name}
														</span>
													</div>
												</div>

												<div className="flex items-center space-x-2">
													<Badge className={status.color}>
														<StatusIcon className="w-3 h-3 mr-1" />
														{status.label}
													</Badge>
													{priority&&(
														<Badge className={priority.color}>
															{priority.label}
														</Badge>
													)}
												</div>
											</div>

											<div className="flex items-center space-x-4 text-sm text-violet-200/70">
												{app.location&&(
													<div className="flex items-center space-x-1">
														<MapPin className="w-4 h-4" />
														<span>{app.location}</span>
														{app.isRemote&&(
															<Badge className="ml-2 text-xs bg-emerald-500 text-white border-emerald-600">
																Remote
															</Badge>
														)}
													</div>
												)}
												<div className="flex items-center space-x-1">
													<Calendar className="w-4 h-4" />
													<span>Applied {formatDate( app.appliedAt )}</span>
												</div>
												{app.salary&&(
													<div className="flex items-center space-x-1">
														<Star className="w-4 h-4" />
														<span>{app.salary}</span>
													</div>
												)}
											</div>

											{app.notes&&(
												<p className="text-sm text-violet-200/70 bg-white/[0.04] p-3 rounded-lg border border-white/[0.06]">
													{app.notes}
												</p>
											)}
										</div>
									</div>

									{/* Action Buttons */}
									<div className="flex items-center space-x-2 ml-4">
										{app.jobUrl&&(
											<Button
												variant="outline"
												size="sm"
												onClick={() => window.open( app.jobUrl!,'_blank' )}
												className="text-violet-300 hover:text-white border-white/[0.10] hover:border-white/[0.20]"
											>
												<ExternalLink className="w-4 h-4" />
											</Button>
										)}
										<Button
											variant="outline"
											size="sm"
											className="text-violet-300 hover:text-white border-white/[0.10] hover:border-white/[0.20]"
											onClick={() => handleEditApplication( app )}
										>
											<Edit className="w-4 h-4" />
										</Button>
										<Button
											variant="outline"
											size="sm"
											className="text-red-400 hover:text-red-300 border-white/[0.10] hover:border-white/[0.20]"
										>
											<Trash2 className="w-4 h-4" />
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>
					)
				} )}
			</div>

			{/* Edit Application Dialog */}
			<EditApplicationDialog
				open={isEditDialogOpen}
				onOpenChange={setIsEditDialogOpen}
				application={editingApplication}
				onApplicationUpdated={handleApplicationUpdated}
			/>
		</>
	)
}
