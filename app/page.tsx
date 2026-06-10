'use client'

import { Button } from '@/components/ui/button'
import { Card,CardDescription,CardHeader,CardTitle } from '@/components/ui/card'
import { ArrowRight,Briefcase,Building2,Calendar,CheckCircle,LogOut,Users,Zap } from 'lucide-react'
import { signOut,useSession } from '@/lib/auth/client'
import { useRouter } from 'next/navigation'

export default function HomePage () {
	const { data: session,isPending }=useSession()
	const router=useRouter()
	const hasSession=!isPending&&!!session
	const isLoading=isPending

	const handleGetStarted=() => {
		if ( hasSession ) {
			router.push( '/dashboard' )
		} else {
			router.push( '/auth/signup' )
		}
	}

	const handleSignIn=() => {
		if ( hasSession ) {
			router.push( '/dashboard' )
		} else {
			router.push( '/auth/signin' )
		}
	}

	const handleSignOut=async () => {
		try {
			await signOut().then( () => { window.location.href='/' } )
		} catch ( error ) {
			console.error( 'Error signing out:',error )
		}
	}

	const features=[
		{
			icon: Briefcase,
			title: 'Application Tracking',
			description: 'Keep track of all your job applications in one place with detailed status updates.',
			gradient: 'from-violet-500 to-purple-600',
		},
		{
			icon: Building2,
			title: 'Company Management',
			description: 'Store company information, logos, and details for easy reference.',
			gradient: 'from-blue-500 to-indigo-600',
		},
		{
			icon: Calendar,
			title: 'Progress Tracking',
			description: 'Monitor your application progress from applied to offer with visual indicators.',
			gradient: 'from-emerald-500 to-green-600',
		},
		{
			icon: CheckCircle,
			title: 'Task Management',
			description: 'Set reminders and track follow-up tasks to stay on top of your applications.',
			gradient: 'from-amber-500 to-orange-600',
		},
		{
			icon: Users,
			title: 'Team Collaboration',
			description: 'Share your progress with mentors or career coaches for guidance.',
			gradient: 'from-pink-500 to-rose-600',
		},
		{
			icon: Zap,
			title: 'Quick Actions',
			description: 'Fast access to common tasks and quick application entry.',
			gradient: 'from-indigo-500 to-violet-600',
		},
	]

	return (
		<div className="min-h-screen relative">
			{/* Navigation */}
			<nav className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between px-8 py-8">
				<div className="flex items-center space-x-2">
					<div className="w-8 h-8 rounded-lg flex items-center justify-center">
						<img src="/favicon.svg" alt="CodeniWork" className="w-6 h-6" />
					</div>
					<span className="text-xl font-bold text-white">CodeniWork</span>
				</div>
				<div className="flex items-center space-x-4">
					{hasSession&&(
						<>
							<span className="text-violet-200/70 text-sm">
								Welcome, {session?.user?.name||'User'}!
							</span>
							<Button
								onClick={handleSignOut}
								variant="outline"
								className="border-red-500/20 text-red-300 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-200"
							>
								<LogOut className="w-4 h-4 mr-2" />
								Sign Out
							</Button>
						</>
					)}
					<Button
						onClick={handleGetStarted}
						variant="default"
					>
						{hasSession? 'Dashboard':'Get Started'}
					</Button>
				</div>
			</nav>

			{/* Hero Section */}
			<div className="px-6 py-28 text-center">
				<h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-6">
					<span className="bg-gradient-to-r from-white via-violet-200 to-purple-400 bg-clip-text text-transparent">Track Your Career</span>
					<br />
					<span className="bg-gradient-to-r from-violet-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">with CodeniWork</span>
				</h1>
				<p className="text-xl text-violet-200/70 max-w-3xl mx-auto mb-10">
					Organize your job search, track applications, and never miss a follow-up.
					Built with a clean, intuitive interface inspired by modern design principles.
				</p>
				<div className="flex flex-col sm:flex-row gap-4 justify-center">
					{hasSession? (
						<Button
							onClick={handleGetStarted}
							variant="glow"
							size="lg"
							className="text-lg px-8 py-6"
						>
							Go to Dashboard
							<ArrowRight className="ml-2 w-5 h-5" />
						</Button>
					):(
						<>
							<Button
								onClick={handleGetStarted}
								variant="glow"
								size="lg"
								className="text-lg px-8 py-6"
							>
								Start Tracking Now
								<ArrowRight className="ml-2 w-5 h-5" />
							</Button>
							<Button
								onClick={handleSignIn}
								variant="outline"
								size="lg"
								className="text-lg px-8 py-6"
							>
								Sign In
							</Button>
						</>
					)}
				</div>
			</div>

			{/* Features Section */}
			<div className="px-6 py-20">
				<div className="max-w-7xl mx-auto">
					<h2 className="text-4xl font-bold text-center text-gradient-heading mb-16">
						Everything you need to manage your job search
					</h2>
					<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
						{features.map( ( feature,index ) => {
							const Icon=feature.icon
							return (
								<Card
									key={feature.title}
									className="glass glass-interactive animate-fade-up"
									style={{ animationDelay: `${index*80}ms` }}
								>
									<CardHeader>
										<div className={`w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-card flex items-center justify-center mb-4 shadow-lg`}>
											<Icon className="w-7 h-7 text-white" />
										</div>
										<CardTitle className="text-white">{feature.title}</CardTitle>
										<CardDescription className="text-violet-200/60">
											{feature.description}
										</CardDescription>
									</CardHeader>
								</Card>
							)
						} )}
					</div>
				</div>
			</div>

			{/* CTA Section */}
			{!hasSession&&(
				<div className="px-6 py-20">
					<div className="max-w-4xl mx-auto">
						<Card className="glass-elevated p-12 text-center">
							<h2 className="text-3xl font-bold text-gradient-heading mb-4">
								Ready to take control of your job search?
							</h2>
							<p className="text-xl text-violet-200/70 mb-8">
								Join thousands of job seekers who are already using CodeniWork to organize their applications.
							</p>
							<Button
								onClick={handleGetStarted}
								variant="glow"
								size="lg"
								className="text-lg px-8 py-6"
							>
								Get Started Free
								<ArrowRight className="ml-2 w-5 h-5" />
							</Button>
						</Card>
					</div>
				</div>
			)}

			{/* Footer */}
			<footer className="px-6 py-12 bg-white/[0.02] border-t border-white/[0.06]">
				<div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between">
					<div className="text-center md:text-left mb-4 md:mb-0">
						<div className="flex items-center justify-center md:justify-start space-x-2 mb-4">
							<div className="w-8 h-8 rounded-lg flex items-center justify-center">
								<img src="/favicon.svg" alt="CodeniWork" className="w-6 h-6" />
							</div>
							<span className="text-lg font-bold text-white">CodeniWork</span>
						</div>
						<p className="text-violet-200/50 mb-4">
							Organize your job search, track applications, and land your dream job.
						</p>
						<p className="text-sm text-violet-200/30">
							&copy; 2026 CodeniWork. All rights reserved.
						</p>
					</div>

					<div className="text-center md:text-right">
						<p className="text-sm text-violet-200/30">
							Made with love by <a href="https://tioye.dev" target="_blank" rel="noopener noreferrer" className="font-semibold text-violet-300 hover:text-violet-200 transition-colors duration-200 underline decoration-violet-400/50 hover:decoration-violet-300">CodenificienT</a>
						</p>
					</div>
				</div>
			</footer>
		</div>
	)
}
