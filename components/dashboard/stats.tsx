'use client'

import { Card,CardContent,CardHeader,CardTitle } from '@/components/ui/card'
import {
	Briefcase,
	Building2,
	Calendar,
	CheckCircle,
	Clock,
	TrendingUp,
	XCircle
} from 'lucide-react'
import { useSession } from '@/lib/auth/client'
import { useEffect, useState } from 'react'
// Database queries moved to API routes

interface DashboardStatsData {
	totalApplications: number
	activeCompanies: number
	inProgress: number
	interviews: number
	offers: number
	rejected: number
	successRate: number
	applied: number
	success: number
}

export function DashboardStats() {
	const { data: session } = useSession()
	const [stats, setStats] = useState<DashboardStatsData | null>(null)
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		async function fetchStats() {
			if (!session?.user?.id) return

			try {
				const response = await fetch('/api/dashboard/stats')
				if (!response.ok) {
					throw new Error('Failed to fetch stats')
				}
				const statsData = await response.json()
				setStats(statsData)
			} catch (error) {
				console.error('Error fetching dashboard stats:', error)
			} finally {
				setIsLoading(false)
			}
		}

		fetchStats()
	}, [session?.user?.id])

	if (isLoading) {
		return (
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<h2 className="text-2xl font-bold text-white">Overview</h2>
					<div className="flex items-center space-x-2 text-sm text-violet-200/70">
						<TrendingUp className="w-4 h-4" />
						<span>Last 30 days</span>
					</div>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
					{Array.from({ length: 6 }).map((_, i) => (
						<Card key={i} className="glass">
							<CardHeader className="pb-3">
								<div className="h-8 skeleton rounded"></div>
							</CardHeader>
							<CardContent className="pt-0">
								<div className="h-6 skeleton rounded mb-2"></div>
								<div className="h-4 skeleton rounded"></div>
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		)
	}

	if (!stats) {
		return (
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<h2 className="text-2xl font-bold text-white">Overview</h2>
					<div className="flex items-center space-x-2 text-sm text-violet-200/70">
						<TrendingUp className="w-4 h-4" />
						<span>Last 30 days</span>
					</div>
				</div>
				<div className="text-center py-8">
					<p className="text-violet-200/70">No data available</p>
				</div>
			</div>
		)
	}

	const statsData = [
		{
			title: 'Total Applications',
			value: stats.totalApplications.toString(),
			change: '+0%',
			changeType: 'positive' as const,
			icon: Briefcase,
			color: 'from-blue-500 to-blue-600',
			bgColor: 'bg-blue-500/15',
			textColor: 'text-blue-400'
		},
		{
			title: 'Active Companies',
			value: stats.activeCompanies.toString(),
			change: '+0%',
			changeType: 'positive' as const,
			icon: Building2,
			color: 'from-purple-500 to-purple-600',
			bgColor: 'bg-purple-500/15',
			textColor: 'text-purple-400'
		},
		{
			title: 'In Progress',
			value: stats.inProgress.toString(),
			change: '+0',
			changeType: 'positive' as const,
			icon: Clock,
			color: 'from-orange-500 to-orange-600',
			bgColor: 'bg-orange-500/15',
			textColor: 'text-orange-400'
		},
		{
			title: 'Interviews',
			value: stats.interviews.toString(),
			change: '+0',
			changeType: 'positive' as const,
			icon: Calendar,
			color: 'from-teal-500 to-teal-600',
			bgColor: 'bg-teal-500/15',
			textColor: 'text-teal-400'
		},
		{
			title: 'Offers',
			value: stats.offers.toString(),
			change: '+0',
			changeType: 'positive' as const,
			icon: CheckCircle,
			color: 'from-green-500 to-green-600',
			bgColor: 'bg-green-500/15',
			textColor: 'text-green-400'
		},
		{
			title: 'Rejected',
			value: stats.rejected.toString(),
			change: '+0',
			changeType: 'positive' as const,
			icon: XCircle,
			color: 'from-red-500 to-red-600',
			bgColor: 'bg-red-500/15',
			textColor: 'text-red-400'
		}
	]

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-bold text-white">
					Overview
				</h2>
				<div className="flex items-center space-x-2 text-sm text-violet-200/70">
					<TrendingUp className="w-4 h-4" />
					<span>Last 30 days</span>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
				{statsData.map((stat, index) => {
					const IconComponent = stat.icon
					return (
						<Card
							key={index}
							className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 glass-interactive"
						>
							<CardHeader className="pb-3">
								<div className="flex items-center justify-between">
									<div className={`p-2 rounded-lg ${stat.bgColor}`}>
										<IconComponent className={`w-5 h-5 ${stat.textColor}`} />
									</div>
									<span className={`text-xs font-medium px-2 py-1 rounded-full ${stat.changeType === 'positive'
										? 'bg-emerald-500/15 text-emerald-300'
										: 'bg-red-500/15 text-red-300'
										}`}>
										{stat.change}
									</span>
								</div>
							</CardHeader>
							<CardContent className="pt-0">
								<CardTitle className="text-2xl font-bold text-white mb-1 text-gradient-primary">
									{stat.value}
								</CardTitle>
								<p className="text-sm text-violet-200/70">
									{stat.title}
								</p>
							</CardContent>
						</Card>
					)
				})}
			</div>

			{/* Progress Bar */}
			<Card className="glass">
				<CardContent className="p-6">
					<div className="flex items-center justify-between mb-4">
						<h3 className="text-lg font-semibold text-white">
							Application Success Rate
						</h3>
						<span className="text-2xl font-bold text-purple-300">
							{stats.successRate}%
						</span>
					</div>
					<div className="w-full bg-white/[0.06] rounded-full h-3">
						<div
							className="bg-gradient-to-r from-purple-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
							style={{ width: `${stats.successRate}%` }}
						></div>
					</div>
					<div className="flex justify-between text-sm text-violet-200/70 mt-2">
						<span>Applied: {stats.applied}</span>
						<span>Success: {stats.success}</span>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
