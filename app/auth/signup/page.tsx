'use client'

import { AuthShell } from '@/components/auth/auth-shell'
import { usePasskeyAuth } from '@/hooks/use-passkey-auth'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const steps: [ string,string ][]=[
	[ 'Account','Name, email, password' ],
	[ 'Master password','Encrypts your applications' ],
	[ 'Passkey','Optional, sign in without typing' ],
]

const STRENGTH_LABELS=[ 'too short','weak','fair','good','strong' ]

/** Four bars: length, then variety of character classes. */
function passwordStrength ( password: string ): number {
	if ( password.length===0 ) return 0
	let score=password.length>=12? 2:password.length>=8? 1:0
	if ( /[a-z]/.test( password )&&/[A-Z]/.test( password ) ) score+=1
	if ( /\d/.test( password )&&/[^\w\s]/.test( password ) ) score+=1
	return Math.min( score,4 )
}

const fieldClass=
	'mt-[9px] w-full border border-br bg-transparent p-3.5 font-mono text-[13px] text-fg placeholder:text-dim focus:border-ac focus:outline-none'
const labelClass='block text-[11px] uppercase tracking-[.1em] text-dim'

export default function SignUpPage () {
	const router=useRouter()
	const [ isLoading,setIsLoading ]=useState( false )
	const [ step,setStep ]=useState( 1 )
	const [ , setUserId ]=useState<string|null>( null )
	const [ error,setError ]=useState<string|null>( null )
	const [ formData,setFormData ]=useState( {
		email: '',
		password: '',
		name: '',
		masterPassword: '',
		confirmMasterPassword: '',
	} )
	const { isSupported,registerPasskey,setupMasterPassword }=usePasskeyAuth()

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
			const response=await fetch( '/api/auth/signup',{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify( {
					email: formData.email,
					password: formData.password,
					name: formData.name,
				} ),
			} )

			const data=await response.json()

			if ( !response.ok ) {
				setError( data.error||'Failed to create account' )
				setIsLoading( false )
				return
			}

			setUserId( data.userId )
			setStep( 2 )
			setIsLoading( false )
		} catch ( err ) {
			console.error( 'Sign up error:',err )
			setError( 'An unexpected error occurred. Please try again.' )
			setIsLoading( false )
		}
	}

	const handleMasterPasswordSetup=async ( e: React.FormEvent ) => {
		e.preventDefault()
		setIsLoading( true )
		setError( null )

		if ( formData.masterPassword!==formData.confirmMasterPassword ) {
			setError( 'Master passwords do not match' )
			setIsLoading( false )
			return
		}

		if ( formData.masterPassword.length<12 ) {
			setError( 'Master password must be at least 12 characters long' )
			setIsLoading( false )
			return
		}

		try {
			await setupMasterPassword( formData.masterPassword )
			setStep( 3 )
			setIsLoading( false )
		} catch ( err ) {
			console.error( 'Master password setup error:',err )
			setError( 'Failed to setup master password. Please try again.' )
			setIsLoading( false )
		}
	}

	const handlePasskeySetup=async () => {
		setIsLoading( true )
		setError( null )

		try {
			await registerPasskey( formData.email,formData.name )
			router.push( '/dashboard?message=Account created successfully! Your passkey has been registered.' )
		} catch ( err ) {
			console.error( 'Passkey setup error:',err )
			setError( 'Failed to setup passkey. You can set it up later in your profile.' )
			setTimeout( () => {
				router.push( '/dashboard?message=Account created successfully!' )
			},2000 )
		} finally {
			setIsLoading( false )
		}
	}

	const skipPasskeySetup=() => {
		router.push( '/dashboard?message=Account created successfully!' )
	}

	const strength=passwordStrength( formData.password )

	return (
		<AuthShell
			aside={
				<>
					<div className="mt-11 flex flex-col">
						{steps.map( ( [ title,description ],index ) => {
							const number=index+1
							const isCurrent=number===step
							const isDone=number<step
							return (
								<div key={title} className="flex gap-3.5 border-b border-br py-3.5">
									<span
										className={cn(
											'w-[26px] flex-none',
											isCurrent||isDone? 'text-ac':'text-dim'
										)}
									>
										{String( number ).padStart( 2,'0' )}
									</span>
									<div>
										<div className={isCurrent? 'text-fg':'text-dim'}>{title}</div>
										<div className="mt-[5px] text-[11.5px] text-dim">{description}</div>
									</div>
								</div>
							)
						} )}
					</div>
					<div className="mt-auto text-[11.5px] leading-[1.8] text-dim">
						Nothing is shared. Export or delete everything at any time from your profile.
					</div>
				</>
			}
		>
			<Link href="/" className="text-[12px] text-dim no-underline transition-colors hover:text-fg">
				← Back to Home
			</Link>

			<h1 className="display mt-[38px] text-[30px] font-extralight">
				{step===1? 'Create your account':step===2? 'Set a master password':'Add a passkey'}
			</h1>
			<p className="mt-3.5 text-[12.5px] leading-[1.7] text-dim">
				{step===1
					? 'Start tracking applications in under a minute'
					:step===2
						? 'This key encrypts your applications. CodeniWork never sees it, and it cannot be reset.'
						:'Sign in from this device without typing anything. You can add one later instead.'}
			</p>

			{error&&<div className="mt-5 border border-dg px-4 py-3 text-[12px] text-dg">{error}</div>}

			{step===1&&(
				<form onSubmit={handleEmailSignUp} className="mt-[30px]">
					<label htmlFor="name" className={labelClass}>Name</label>
					<input
						id="name"
						name="name"
						type="text"
						autoComplete="name"
						required
						value={formData.name}
						onChange={handleInputChange}
						placeholder="Your name"
						className={fieldClass}
					/>

					<label htmlFor="email" className={cn( labelClass,'mt-5' )}>Email</label>
					<input
						id="email"
						name="email"
						type="email"
						autoComplete="email"
						required
						value={formData.email}
						onChange={handleInputChange}
						placeholder="you@example.com"
						className={fieldClass}
					/>

					<label htmlFor="password" className={cn( labelClass,'mt-5' )}>Password</label>
					<input
						id="password"
						name="password"
						type="password"
						autoComplete="new-password"
						required
						value={formData.password}
						onChange={handleInputChange}
						placeholder="••••••••••••"
						className={fieldClass}
					/>
					<div className="mt-[9px] flex items-center gap-[5px]">
						{Array.from( { length: 4 } ).map( ( _,i ) => (
							<div key={i} className={cn( 'h-[3px] flex-1',i<strength? 'bg-ac':'bg-br' )} />
						) )}
						<span className="ml-2 text-[11px] text-dim">
							{formData.password? STRENGTH_LABELS[ strength ]:''}
						</span>
					</div>

					<button
						type="submit"
						disabled={isLoading}
						className="mt-[26px] flex w-full justify-between bg-ac p-4 text-left font-mono text-[13px] font-medium text-af transition-colors hover:bg-ac-deep disabled:opacity-50"
					>
						<span>{isLoading? 'Creating account…':'Continue'}</span>
						<span className="opacity-60">⏎</span>
					</button>
				</form>
			)}

			{step===2&&(
				<form onSubmit={handleMasterPasswordSetup} className="mt-[30px]">
					<label htmlFor="masterPassword" className={labelClass}>Master password</label>
					<input
						id="masterPassword"
						name="masterPassword"
						type="password"
						autoComplete="new-password"
						required
						value={formData.masterPassword}
						onChange={handleInputChange}
						placeholder="at least 12 characters"
						className={fieldClass}
					/>

					<label htmlFor="confirmMasterPassword" className={cn( labelClass,'mt-5' )}>Confirm</label>
					<input
						id="confirmMasterPassword"
						name="confirmMasterPassword"
						type="password"
						autoComplete="new-password"
						required
						value={formData.confirmMasterPassword}
						onChange={handleInputChange}
						placeholder="••••••••••••"
						className={fieldClass}
					/>

					<button
						type="submit"
						disabled={isLoading}
						className="mt-[26px] flex w-full justify-between bg-ac p-4 text-left font-mono text-[13px] font-medium text-af transition-colors hover:bg-ac-deep disabled:opacity-50"
					>
						<span>{isLoading? 'Setting up…':'Continue'}</span>
						<span className="opacity-60">⏎</span>
					</button>
				</form>
			)}

			{step===3&&(
				<div className="mt-[30px]">
					{isSupported? (
						<button
							type="button"
							onClick={handlePasskeySetup}
							disabled={isLoading}
							className="flex w-full justify-between bg-ac p-4 text-left font-mono text-[13px] font-medium text-af transition-colors hover:bg-ac-deep disabled:opacity-50"
						>
							<span>{isLoading? 'Registering…':'Add a passkey'}</span>
							<span className="opacity-60">⏎</span>
						</button>
					):(
						<div className="border border-br p-4 text-[12.5px] leading-[1.7] text-dim">
							This browser does not support passkeys. You can add one later from your profile.
						</div>
					)}
					<button
						type="button"
						onClick={skipPasskeySetup}
						className="mt-3 w-full border border-br bg-transparent p-4 font-mono text-[13px] text-fg transition-colors hover:border-ac hover:text-ac"
					>
						Skip for now
					</button>
				</div>
			)}

			<div className="mt-auto pt-7 text-[12px] text-dim">
				Already have an account?{' '}
				<Link href="/auth/signin" className="text-ac no-underline hover:underline">
					Sign in
				</Link>
			</div>
		</AuthShell>
	)
}
