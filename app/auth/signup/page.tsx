'use client'

import { Button } from '@/components/ui/button'
import { Card,CardContent,CardDescription,CardHeader,CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authClient } from '@/lib/auth/client'
import { ArrowLeft,Lock,Mail,User } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export default function SignUpPage () {
	const [ isLoading,setIsLoading ]=useState( false )
	const [ error,setError ]=useState<string|null>( null )
	const [ created,setCreated ]=useState( false )

	const [ formData,setFormData ]=useState( {
		name: '',
		email: '',
		password: '',
	} )

	const handleInputChange=( e: React.ChangeEvent<HTMLInputElement> ) => {
		setFormData( {
			...formData,
			[ e.target.name ]: e.target.value,
		} )
	}

	const handleEmailSignUp=async ( e: React.FormEvent ) => {
		e.preventDefault()
		setIsLoading( true )
		setError( null )

		try {
			// Account is created on CodeniServer via the local /api/auth proxy.
			// Email verification is required before the first sign-in.
			const { error: signUpError }=await authClient.signUp.email( {
				email: formData.email,
				password: formData.password,
				name: formData.name,
			} )

			if ( signUpError ) {
				setError( signUpError.message||'Failed to create account' )
				setIsLoading( false )
				return
			}

			setCreated( true )
		} catch ( error ) {
			console.error( 'Sign up error:',error )
			setError( 'An unexpected error occurred. Please try again.' )
		} finally {
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
						Create your account
					</CardTitle>
					<CardDescription className="text-violet-200/60">
						Start tracking your career with CodeniWork
					</CardDescription>
				</CardHeader>

				<CardContent className="space-y-6">
					{error&&(
						<div className="bg-red-500/10 border border-red-500/20 rounded-card p-4 mb-4">
							<p className="text-sm text-red-300">{error}</p>
						</div>
					)}

					{created? (
						<div className="bg-green-500/10 border border-green-500/20 rounded-card p-6 text-center space-y-2">
							<Mail className="w-8 h-8 text-green-400 mx-auto" />
							<p className="font-medium text-green-300">Check your email</p>
							<p className="text-sm text-violet-200/60">
								We sent a verification link to <strong>{formData.email}</strong>.
								Verify your address, then{' '}
								<Link href="/auth/signin" className="text-violet-400 hover:text-violet-300">
									sign in
								</Link>
								.
							</p>
						</div>
					):(
						<form onSubmit={handleEmailSignUp} className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="name">Full Name</Label>
								<div className="relative">
									<User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-violet-300/40 w-4 h-4" />
									<Input
										id="name"
										name="name"
										type="text"
										placeholder="Enter your full name"
										value={formData.name}
										onChange={handleInputChange}
										className="pl-10"
										required
									/>
								</div>
							</div>

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
										placeholder="At least 12 characters"
										value={formData.password}
										onChange={handleInputChange}
										className="pl-10"
										minLength={12}
										required
									/>
								</div>
							</div>

							<Button
								type="submit"
								disabled={isLoading}
								className="w-full h-12 text-lg font-medium"
							>
								{isLoading? 'Creating account...':'Create Account'}
							</Button>
						</form>
					)}

					<div className="text-center text-sm text-violet-200/60">
						Already have an account?{' '}
						<Link href="/auth/signin" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
							Sign in here
						</Link>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
