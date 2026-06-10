'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Bell,LogOut,Menu,Search,Settings,User,X } from 'lucide-react'
import { signOut,useSession } from '@/lib/auth/client'
import { useRouter } from 'next/navigation'
import { useEffect,useRef,useState } from 'react'

export function DashboardHeader () {
	const { data: session,isPending }=useSession()
	const isLoading=isPending
	const [ isMenuOpen,setIsMenuOpen ]=useState( false )
	const [ searchQuery,setSearchQuery ]=useState( '' )
	const router=useRouter()
	const menuRef=useRef<HTMLDivElement>( null )

	useEffect( () => {
		if ( session ) {
			console.log( 'Better Auth session:',session )
			console.log( 'Session user:',session.user )
		}
	},[ session ] )

	useEffect( () => {
		const handleClickOutside=( event: MouseEvent ) => {
			if ( menuRef.current&&!menuRef.current.contains( event.target as Node ) ) {
				setIsMenuOpen( false )
			}
		}

		document.addEventListener( 'mousedown',handleClickOutside )
		return () => {
			document.removeEventListener( 'mousedown',handleClickOutside )
		}
	},[] )

	const handleSignOut=async () => {
		try {
			await signOut()
			window.location.href='/'
		} catch ( error ) {
			console.error( 'Error signing out:',error )
		}
	}

	if ( isLoading ) {
		return (
			<header className="bg-white/[0.03] backdrop-blur-2xl border-b border-white/[0.06] sticky top-0 z-50">
				<div className="px-6 py-4">
					<div className="flex items-center justify-between max-w-6xl mx-auto">
						<div className="flex flex-1 max-w-md">
							<div className="relative w-full">
								<div className="w-full h-10 skeleton rounded-input"></div>
							</div>
						</div>
						<div className="flex items-center space-x-4">
							<div className="w-10 h-10 skeleton rounded-full"></div>
							<div className="w-10 h-10 skeleton rounded-full"></div>
							<div className="w-10 h-10 skeleton rounded-full"></div>
						</div>
					</div>
				</div>
			</header>
		)
	}

	return (
		<header className="bg-white/[0.03] backdrop-blur-2xl border-b border-white/[0.06] sticky top-0 z-50">
			<div className="px-6 py-4">
				<div className="flex items-center justify-between max-w-6xl mx-auto">
					{/* Search Bar */}
					<div className="flex flex-1 max-w-md">
						<div className="relative w-full">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-violet-300/40 w-4 h-4" />
							<Input
								type="text"
								placeholder="Search applications, companies..."
								value={searchQuery}
								onChange={( e ) => setSearchQuery( e.target.value )}
								className="pl-10"
							/>
						</div>
					</div>

					{/* User Menu and Actions */}
					<div className="flex items-center space-x-4">
						{/* Notifications */}
						<Button
							variant="ghost"
							size="icon"
							className="relative text-violet-200/70 hover:text-white hover:bg-white/[0.06]"
						>
							<Bell className="w-5 h-5" />
							<span className="absolute -top-1 -right-1 w-3 h-3 bg-violet-500 rounded-full shadow-glow-violet animate-glow-pulse"></span>
						</Button>

						{/* Settings */}
						<Button
							variant="ghost"
							size="icon"
							className="text-violet-200/70 hover:text-white hover:bg-white/[0.06]"
						>
							<Settings className="w-5 h-5" />
						</Button>

						{/* User Menu */}
						<div className="relative" ref={menuRef}>
							{isLoading? (
								<div className="w-8 h-8 skeleton rounded-full"></div>
							):session?.user? (
								<Button
									variant="ghost"
									onClick={() => setIsMenuOpen( !isMenuOpen )}
									className="flex items-center space-x-2 text-violet-200/70 hover:text-white hover:bg-white/[0.06]"
								>
									{session.user.image? (
										<img
											src={session.user.image}
											alt={session.user.name||session.user.email||'User'}
											className="w-8 h-8 rounded-full ring-2 ring-violet-500/30"
										/>
									):(
										<div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-full flex items-center justify-center ring-2 ring-violet-500/30">
											<User className="w-4 h-4 text-white" />
										</div>
									)}
									<span className="hidden md:block font-medium text-white text-sm">
										{session.user.name||session.user.email||'User'}
									</span>
								</Button>
							):(
								<Button
									variant="ghost"
									onClick={() => router.push( '/auth/signin' )}
									className="flex items-center space-x-2 text-violet-200/70 hover:text-white hover:bg-white/[0.06]"
								>
									<div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-full flex items-center justify-center">
										<User className="w-4 h-4 text-white" />
									</div>
									<span className="hidden md:block font-medium text-white text-sm">
										Sign In
									</span>
								</Button>
							)}

							{/* Dropdown Menu */}
							{isMenuOpen&&session?.user&&(
								<Card className="absolute right-0 mt-2 w-48 py-2 shadow-glass-elevated">
									<div className="px-4 py-2 border-b border-white/[0.06]">
										<p className="text-sm font-medium text-white">
											{session.user?.name||session.user?.email||'User'}
										</p>
										<p className="text-xs text-violet-200/60">
											{session.user?.email||'No email'}
										</p>
									</div>
									<div className="py-1">
										<button
											onClick={() => {
												router.push( '/profile' )
												setIsMenuOpen( false )
											}}
											className="flex items-center w-full px-4 py-2 text-sm text-violet-200/80 hover:bg-white/[0.06] hover:text-white transition-colors"
										>
											<User className="w-4 h-4 mr-2" />
											Profile Settings
										</button>
										<button
											onClick={handleSignOut}
											className="flex items-center w-full px-4 py-2 text-sm text-violet-200/80 hover:bg-white/[0.06] hover:text-white transition-colors"
										>
											<LogOut className="w-4 h-4 mr-2" />
											Sign Out
										</button>
									</div>
								</Card>
							)}
						</div>

						{/* Mobile Menu Button */}
						<Button
							variant="ghost"
							size="icon"
							onClick={() => setIsMenuOpen( !isMenuOpen )}
							className="md:hidden text-violet-200/70 hover:text-white hover:bg-white/[0.06]"
						>
							{isMenuOpen? (
								<X className="w-5 h-5" />
							):(
								<Menu className="w-5 h-5" />
							)}
						</Button>
					</div>
				</div>

				{/* Mobile Search */}
				{isMenuOpen&&(
					<div className="md:hidden mt-4">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-violet-300/40 w-4 h-4" />
							<Input
								type="text"
								placeholder="Search applications, companies..."
								value={searchQuery}
								onChange={( e ) => setSearchQuery( e.target.value )}
								className="pl-10"
							/>
						</div>
					</div>
				)}
			</div>
		</header>
	)
}
