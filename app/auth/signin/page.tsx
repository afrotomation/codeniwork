'use client'

import { Button } from '@/components/ui/button'
import { Card,CardContent,CardDescription,CardHeader,CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft,Lock,Mail } from 'lucide-react'
import { authClient } from '@/lib/auth/client'
import Link from 'next/link'
import { useEffect,useState } from 'react'

export default function SignInPage () {
	const [ isLoading,setIsLoading ]=useState( false )
	const [ error,setError ]=useState<string|null>( null )
	const [ successMessage,setSuccessMessage ]=useState<string|null>( null )

	const callbackUrl='/dashboard'

	useEffect( () => {
		if ( typeof window!=='undefined' ) {
			const urlParams=new URLSearchParams( window.location.search )
			const message=urlParams.get( 'message' )
			if ( message ) {
				setSuccessMessage( message )
				window.history.replaceState( {},document.title,window.location.pathname )
			}
		}
	},[] )

	const [ formData,setFormData ]=useState( {
		email: '',
		password: '',
	} )

	const handleInputChange=( e: React.ChangeEvent<HTMLInputElement> ) => {
		setFormData( {
			...formData,
			[ e.target.name ]: e.target.value,
		} )
	}

	const handleCredentialsSignIn=async ( e: React.FormEvent ) => {
		e.preventDefault()
		setIsLoading( true )
		setError( null )

		try {
			// Credentials are validated by CodeniServer via the local /api/auth
			// proxy — the session cookie lands first-party on this domain.
			const { error: signInError }=await authClient.signIn.email( {
				email: formData.email,
				password: formData.password,
			} )

			if ( signInError ) {
				setError( signInError.status===403
					? 'Please verify your email first — check your inbox.'
					: 'Invalid email or password. Please try again.' )
				setIsLoading( false )
			} else {
				window.location.href=callbackUrl
			}
		} catch ( error ) {
			setError( 'An unexpected error occurred. Please try again.' )
			setIsLoading( false )
		}
	}

	return (
		<div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
			{/* Background decorations */}
			<div className="absolute inset-0 pointer-events-none">
				<div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-br from-violet-500/15 to-indigo-500/15 rounded-full blur-3xl" />
				<div className="absolute top-40 right-32 w-80 h-80 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl" />
				<div className="absolute bottom-32 left-1/3 w-72 h-72 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl" />
			</div>

			<Card className="w-full max-w-md glass-elevated relative z-10">
				<CardHeader className="text-center space-y-4">
					<Link href="/" className="inline-flex items-center text-sm text-violet-200/60 hover:text-white mb-4 transition-colors">
						<ArrowLeft className="w-4 h-4 mr-2" />
						Back to Home
					</Link>
					<div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-glow-violet">
						<img src="/favicon.svg" alt="CodeniWork" className="w-10 h-10" />
					</div>
					<CardTitle className="text-3xl font-bold text-gradient-heading">
						Welcome to CodeniWork
					</CardTitle>
					<CardDescription className="text-violet-200/60">
						Sign in to continue tracking your career with CodeniWork
					</CardDescription>
				</CardHeader>

				<CardContent className="space-y-6">
					{/* Error Display */}
					{error&&(
						<div className="bg-red-500/10 border border-red-500/20 rounded-card p-4 mb-4">
							<div className="flex items-center">
								<div className="flex-shrink-0">
									<svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
										<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
									</svg>
								</div>
								<div className="ml-3">
									<p className="text-sm text-red-300">{error}</p>
								</div>
							</div>
						</div>
					)}

					{/* Credentials Sign In Form */}
					<form onSubmit={handleCredentialsSignIn} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<div className="relative">
								<Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-violet-300/40 w-4 h-4" />
								<Input
									id="email"
									name="email"
									type="email"
									placeholder="Enter your email"
									value={formData.email}
									onChange={handleInputChange}
									className="pl-10"
									required
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="password">Password</Label>
							<div className="relative">
								<Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-violet-300/40 w-4 h-4" />
								<Input
									id="password"
									name="password"
									type="password"
									placeholder="Enter your password"
									value={formData.password}
									onChange={handleInputChange}
									required
								/>
							</div>
						</div>

						<Button
							type="submit"
							disabled={isLoading}
							className="w-full h-12 text-lg font-medium"
						>
							{isLoading? 'Signing In...':'Sign In with Email'}
						</Button>
					</form>

					{/* Sign Up Link */}
					<div className="text-center text-sm text-violet-200/60">
						Don't have an account?{' '}
						<Link href="/auth/signup" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
							Sign up here
						</Link>
					</div>

					{/* Terms */}
					<div className="text-center text-xs text-violet-200/40">
						By signing in, you agree to our{' '}
						<Link href="/terms" className="text-violet-400/70 hover:text-violet-300">
							Terms of Service
						</Link>{' '}
						and{' '}
						<Link href="/privacy" className="text-violet-400/70 hover:text-violet-300">
							Privacy Policy
						</Link>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
