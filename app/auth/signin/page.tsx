'use client'

import { AuthShell } from '@/components/auth/auth-shell'
import { usePasskeyAuth } from '@/hooks/use-passkey-auth'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect,useState } from 'react'

/**
 * The design's aside lists what changed "since you last signed in". Nobody is
 * signed in on this screen, so that would either be fabricated or another
 * account's pipeline. These are the three promises the product actually makes.
 */
const promises: [ string,string ][]=[
	[ '01','Every application in one place, with its next step' ],
	[ '02','A queue of what is waiting on you, not a feed' ],
	[ '03','Deadlines and follow-ups before they go late' ],
]

export default function SignInPage () {
	const router=useRouter()
	const [ isLoading,setIsLoading ]=useState( false )
	const [ error,setError ]=useState<string|null>( null )
	const [ successMessage,setSuccessMessage ]=useState<string|null>( null )
	const { isSupported,authenticateWithPasskey }=usePasskeyAuth()

	const callbackUrl='/dashboard'

	const [ formData,setFormData ]=useState( {
		email: '',
		password: '',
	} )

	useEffect( () => {
		if ( typeof window==='undefined' ) return

		const urlParams=new URLSearchParams( window.location.search )
		const message=urlParams.get( 'message' )
		if ( message ) {
			setSuccessMessage( message )
			window.history.replaceState( {},document.title,window.location.pathname )
		}
	},[] )

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
			const result=await signIn( 'credentials',{
				email: formData.email,
				password: formData.password,
				redirect: false,
			} )

			if ( result?.error ) {
				setError( 'Invalid email or password. Please try again.' )
				setIsLoading( false )
			} else {
				router.push( callbackUrl )
			}
		} catch {
			setError( 'An unexpected error occurred. Please try again.' )
			setIsLoading( false )
		}
	}

	const handlePasskeySignIn=async () => {
		setIsLoading( true )
		setError( null )

		try {
			const result=await authenticateWithPasskey()
			if ( result.verified&&result.user ) {
				const signInResult=await signIn( 'credentials',{
					email: result.user.email,
					password: 'passkey-auth',
					redirect: false,
				} )

				if ( signInResult?.error ) {
					setError( 'Authentication failed. Please try again.' )
					setIsLoading( false )
				} else {
					router.push( callbackUrl )
				}
			}
		} catch ( err ) {
			console.error( 'Passkey authentication error:',err )
			setError( 'Passkey authentication failed. Please try email and password.' )
			setIsLoading( false )
		}
	}

	return (
		<AuthShell
			aside={
				<>
					<div className="mt-auto eyebrow">what codeniwork does</div>
					<div className="mt-[18px] flex flex-col gap-3.5 text-[12.5px]">
						{promises.map( ( [ marker,text ] ) => (
							<div key={marker} className="flex gap-3.5">
								<span className="w-[26px] flex-none text-ac">{marker}</span>
								<span>{text}</span>
							</div>
						) )}
					</div>
					<div className="mt-[26px] h-px bg-br" />
					<div className="mt-[26px] text-[11.5px] leading-[1.8] text-dim">
						Your data stays encrypted with your master password. CodeniWork never sees it.
					</div>
				</>
			}
		>
			<Link href="/" className="text-[12px] text-dim no-underline transition-colors hover:text-fg">
				← Back to Home
			</Link>

			<h1 className="display mt-[38px] text-[30px] font-extralight">Welcome to CodeniWork</h1>
			<p className="mt-3.5 text-[12.5px] leading-[1.7] text-dim">
				Sign in to continue tracking your career with CodeniWork
			</p>

			{successMessage&&(
				<div className="panel-accent mt-5 px-4 py-3 text-[12px] text-ac">{successMessage}</div>
			)}
			{error&&(
				<div className="mt-5 border border-dg px-4 py-3 text-[12px] text-dg">{error}</div>
			)}

			{isSupported&&(
				<>
					<button
						type="button"
						onClick={handlePasskeySignIn}
						disabled={isLoading}
						className="mt-[30px] flex justify-between bg-ac p-4 text-left font-mono text-[13px] font-medium text-af transition-colors hover:bg-ac-deep disabled:opacity-50"
					>
						<span>Sign In with Passkey</span>
						<span className="opacity-60">⏎</span>
					</button>

					<div className="my-[26px] flex items-center gap-3.5">
						<div className="h-px flex-1 bg-br" />
						<span className="text-[10.5px] uppercase tracking-[.12em] text-dim">or continue with</span>
						<div className="h-px flex-1 bg-br" />
					</div>
				</>
			)}

			<form onSubmit={handleCredentialsSignIn} className={isSupported? '':'mt-[30px]'}>
				<label htmlFor="email" className="block text-[11px] uppercase tracking-[.1em] text-dim">
					Email
				</label>
				<input
					id="email"
					name="email"
					type="email"
					autoComplete="email"
					required
					value={formData.email}
					onChange={handleInputChange}
					placeholder="you@example.com"
					className="mt-[9px] w-full border border-br bg-transparent p-3.5 font-mono text-[13px] text-fg placeholder:text-dim focus:border-ac focus:outline-none"
				/>

				<label htmlFor="password" className="mt-5 block text-[11px] uppercase tracking-[.1em] text-dim">
					Password
				</label>
				<input
					id="password"
					name="password"
					type="password"
					autoComplete="current-password"
					required
					value={formData.password}
					onChange={handleInputChange}
					placeholder="••••••••••••"
					className="mt-[9px] w-full border border-br bg-transparent p-3.5 font-mono text-[13px] text-fg placeholder:text-dim focus:border-ac focus:outline-none"
				/>

				<button
					type="submit"
					disabled={isLoading}
					className="mt-6 w-full border border-br bg-transparent p-4 font-mono text-[13px] text-fg transition-colors hover:border-ac hover:text-ac disabled:opacity-50"
				>
					{isLoading? 'Signing in…':'Sign In with Email'}
				</button>
			</form>

			<div className="mt-auto pt-7 text-[12px] text-dim">
				Don&apos;t have an account?{' '}
				<Link href="/auth/signup" className="text-ac no-underline hover:underline">
					Sign up here
				</Link>
			</div>
			<div className="mt-3 text-[11px] leading-[1.7] text-dim opacity-75">
				By signing in, you agree to our <span className="text-dim">Terms of Service</span> and{' '}
				<span className="text-dim">Privacy Policy</span>
			</div>
		</AuthShell>
	)
}
