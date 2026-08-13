'use client'

import { DashboardHeader } from '@/components/dashboard/header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AddApplicationDialog } from '@/components/dashboard/add-application-dialog'
import { UploadDocumentDialog } from '@/components/dashboard/upload-document-dialog'
import { ScheduleFollowupDialog } from '@/components/dashboard/schedule-followup-dialog'
import { ExportDataDialog } from '@/components/dashboard/export-data-dialog'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import {
	Calendar,
	ExternalLink,
	FileText,
	Plus,
	TrendingUp,
	Zap,
	Target,
	Briefcase,
	UserPlus,
	Send,
	RefreshCw
} from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

// Quick action categories with enhanced functionality
const quickActions = [
	{
		category: 'Applications',
		actions: [
			{
				title: 'Add New Application',
				description: 'Track a new job application',
				icon: Plus,
				color: 'from-blue-500 to-blue-600',
				action: 'add-application',
				shortcut: 'Ctrl + N'
			},
			{
				title: 'View Applications',
				description: 'See all your applications',
				icon: Briefcase,
				color: 'from-green-500 to-green-600',
				action: 'navigate',
				href: '/dashboard/applications',
				shortcut: 'Ctrl + A'
			},
			{
				title: 'Update Status',
				description: 'Update application progress',
				icon: TrendingUp,
				color: 'from-purple-500 to-purple-600',
				action: 'navigate',
				href: '/dashboard/applications',
				shortcut: 'Ctrl + U'
			}
		]
	},
	{
		category: 'Documents',
		actions: [
			{
				title: 'Upload Resume',
				description: 'Add new resume version',
				icon: FileText,
				color: 'from-orange-500 to-orange-600',
				action: 'upload-document',
				documentType: 'resume',
				shortcut: 'Ctrl + R'
			},
			{
				title: 'Create Cover Letter',
				description: 'Write a new cover letter',
				icon: FileText,
				color: 'from-pink-500 to-pink-600',
				action: 'upload-document',
				documentType: 'cover_letter',
				shortcut: 'Ctrl + L'
			},
			{
				title: 'Update Portfolio',
				description: 'Refresh your portfolio',
				icon: FileText,
				color: 'from-indigo-500 to-indigo-600',
				action: 'upload-document',
				documentType: 'portfolio',
				shortcut: 'Ctrl + P'
			}
		]
	},
	{
		category: 'Networking',
		actions: [
			{
				title: 'Add New Contact',
				description: 'Save a new connection',
				icon: UserPlus,
				color: 'from-teal-500 to-teal-600',
				action: 'navigate',
				href: '/dashboard/contacts',
				shortcut: 'Ctrl + C'
			},
			{
				title: 'Schedule Follow-up',
				description: 'Set reminder for contact',
				icon: Calendar,
				color: 'from-cyan-500 to-cyan-600',
				action: 'schedule-followup',
				shortcut: 'Ctrl + F'
			},
			{
				title: 'Send Thank You',
				description: 'Follow up after interview',
				icon: Send,
				color: 'from-emerald-500 to-emerald-600',
				action: 'send-thankyou',
				shortcut: 'Ctrl + T'
			}
		]
	},
	{
		category: 'Analytics & Tools',
		actions: [
			{
				title: 'View Analytics',
				description: 'Track your progress',
				icon: Target,
				color: 'from-red-500 to-red-600',
				action: 'navigate',
				href: '/dashboard/analytics',
				shortcut: 'Ctrl + G'
			},
			{
				title: 'Export Data',
				description: 'Download your data',
				icon: FileText,
				color: 'from-yellow-500 to-yellow-600',
				action: 'export-data',
				shortcut: 'Ctrl + E'
			},
			{
				title: 'Refresh Data',
				description: 'Update all information',
				icon: RefreshCw,
				color: 'from-gray-500 to-gray-600',
				action: 'refresh-data',
				shortcut: 'Ctrl + R'
			},
			{
				title: 'Auto-Reject Old Apps',
				description: 'Close applications silent for 21 days',
				icon: RefreshCw,
				color: 'from-orange-500 to-orange-600',
				action: 'auto-reject'
			}
		]
	}
]

export default function QuickActionsPage() {
	const router = useRouter()
	const [isAddApplicationOpen, setIsAddApplicationOpen] = useState(false)
	const [isUploadDocumentOpen, setIsUploadDocumentOpen] = useState(false)
	const [isScheduleFollowupOpen, setIsScheduleFollowupOpen] = useState(false)
	const [isExportDataOpen, setIsExportDataOpen] = useState(false)
	const [documentType, setDocumentType] = useState('')
	const [isRefreshing, setIsRefreshing] = useState(false)

	// Handle action clicks
	const handleActionClick = (action: any) => {
		switch (action.action) {
			case 'add-application':
				setIsAddApplicationOpen(true)
				break
			case 'upload-document':
				setDocumentType(action.documentType)
				setIsUploadDocumentOpen(true)
				break
			case 'schedule-followup':
				setIsScheduleFollowupOpen(true)
				break
			case 'send-thankyou':
				// Navigate to applications to send thank you
				router.push('/dashboard/applications')
				break
			case 'export-data':
				setIsExportDataOpen(true)
				break
			case 'refresh-data':
				handleRefreshData()
				break
			case 'auto-reject':
				handleAutoReject()
				break
			case 'navigate':
				if (action.href) {
					router.push(action.href)
				}
				break
			default:
				break
		}
	}

	// Close out applications that have been silent past the auto-reject window.
	const handleAutoReject = async () => {
		try {
			const response = await fetch('/api/dashboard/applications/auto-reject', {
				method: 'POST'
			})
			if (!response.ok) {
				throw new Error('Failed to run auto-rejection')
			}
			const result = await response.json()
			alert(`Auto-rejection completed: ${result.rejectedCount} applications processed`)
		} catch (error) {
			console.error('Error running auto-rejection:', error)
			alert('Error running auto-rejection. Check console for details.')
		}
	}

	// Handle data refresh
	const handleRefreshData = async () => {
		setIsRefreshing(true)
		try {
			// Refresh the page to get latest data
			window.location.reload()
		} catch (error) {
			console.error('Error refreshing data:', error)
		} finally {
			setIsRefreshing(false)
		}
	}

	// Handle document upload success
	const handleDocumentUploaded = async () => {
		setIsUploadDocumentOpen(false)
		setDocumentType('')
	}

	// Handle application added success
	const handleApplicationAdded = async () => {
		setIsAddApplicationOpen(false)
	}

	return (
		<div className="min-h-screen">
			<DashboardHeader />
			<div className="p-6">
				<div className="mb-8">
					<h1 className="text-4xl font-bold text-gradient-heading mb-2">Quick Actions</h1>
					<p className="text-violet-300/60">Fast access to common tasks and shortcuts</p>
				</div>

				{/* Quick Actions Grid */}
				<div className="space-y-8 mb-8">
					{quickActions.map((category) => (
						<div key={category.category}>
							<h2 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
								<Zap className="w-5 h-5 text-yellow-400" />
								<span>{category.category}</span>
								<div className="flex-1 h-px bg-gradient-to-r from-white/[0.10] to-transparent ml-4" />
							</h2>
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
								{category.actions.map((action, index) => {
									const Icon = action.icon
									return (
										<Card key={action.title} className="glass glass-interactive cursor-pointer animate-fade-up" style={{ animationDelay: `${index * 80}ms` }}>
											<CardContent className="p-6">
												<div className="flex items-start justify-between mb-4">
													<div className={`w-12 h-12 bg-gradient-to-br ${action.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
														<Icon className="w-6 h-6 text-white" />
													</div>
													<Badge variant="secondary" className="text-xs">
														{action.shortcut}
													</Badge>
												</div>
												<h3 className="text-white font-medium mb-2">
													{action.title}
												</h3>
												<p className="text-violet-200/70 text-sm mb-4">
													{action.description}
												</p>
												<Button
													variant="ghost"
													size="sm"
													onClick={() => handleActionClick(action)}
													className="w-full text-violet-200/70 hover:text-white hover:bg-white/[0.06]"
												>
													{action.action === 'refresh-data' && isRefreshing ? (
														<RefreshCw className="w-4 h-4 mr-2 animate-spin" />
													) : (
														<ExternalLink className="w-4 h-4 mr-2" />
													)}
													{action.action === 'refresh-data' && isRefreshing ? 'Refreshing...' : `Go to ${action.title}`}
												</Button>
											</CardContent>
										</Card>
									)
								})}
							</div>
						</div>
					))}
				</div>

				{/* Recent Activities */}
				<RecentActivity />

				{/* Dialogs */}
				<AddApplicationDialog
					open={isAddApplicationOpen}
					onOpenChange={setIsAddApplicationOpen}
					onApplicationAdded={handleApplicationAdded}
				/>

				<UploadDocumentDialog
					open={isUploadDocumentOpen}
					onOpenChange={setIsUploadDocumentOpen}
					onDocumentUploaded={handleDocumentUploaded}
					presetDocumentType={documentType}
				/>

				<ScheduleFollowupDialog
					open={isScheduleFollowupOpen}
					onOpenChange={setIsScheduleFollowupOpen}
				/>

				<ExportDataDialog
					open={isExportDataOpen}
					onOpenChange={setIsExportDataOpen}
				/>
			</div>
		</div>
	)
}
