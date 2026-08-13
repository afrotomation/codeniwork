'use client'

import { ExportDataDialog } from '@/components/dashboard/export-data-dialog'
import { DashboardHeader } from '@/components/dashboard/header'
import { Button } from '@/components/ui/button'
import { useApplications } from '@/hooks/use-applications'
import { usePasskeyAuth } from '@/hooks/use-passkey-auth'
import { useToast } from '@/hooks/use-toast'
import { formatShortDate } from '@/lib/applications'
import { cn } from '@/lib/utils'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useCallback,useEffect,useState } from 'react'

interface Passkey {
	id: string
	name: string|null
	deviceType: string|null
	createdAt: string
	lastUsed: string|null
}

const fieldClass=
	'mt-2 w-full border border-br bg-transparent p-[13px] font-mono text-[13px] text-fg placeholder:text-dim focus:border-ac focus:outline-none'
const labelClass='text-[11px] uppercase tracking-[.1em] text-dim'

/** A bordered region with a small caps heading, optionally with a right-hand note. */
function Panel ( {
	title,
	note,
	children,
	className,
}: {
	title: string
	note?: React.ReactNode
	children: React.ReactNode
	className?: string
} ) {
	return (
		<div className={cn( 'border border-br',className )}>
			<div className="flex justify-between gap-3 border-b border-br px-5 py-4">
				<span className="text-[10.5px] uppercase tracking-[.12em] text-dim">{title}</span>
				{note&&<span className="text-[11.5px]">{note}</span>}
			</div>
			{children}
		</div>
	)
}

export default function ProfilePage () {
	const { data: session,status,update }=useSession()
	const router=useRouter()
	const { toast }=useToast()
	const { isSupported,registerPasskey,setupMasterPassword }=usePasskeyAuth()
	const { applications }=useApplications()

	const [ name,setName ]=useState( '' )
	const [ isSaving,setIsSaving ]=useState( false )
	const [ passkeys,setPasskeys ]=useState<Passkey[]|null>( null )
	const [ isExportOpen,setIsExportOpen ]=useState( false )
	const [ isChangingMaster,setIsChangingMaster ]=useState( false )
	const [ masterPassword,setMasterPassword ]=useState( '' )

	useEffect( () => {
		if ( session?.user?.name ) setName( session.user.name )
	},[ session?.user?.name ] )

	useEffect( () => {
		if ( status==='unauthenticated' ) router.push( '/auth/signin' )
	},[ status,router ] )

	const loadPasskeys=useCallback( async () => {
		try {
			const response=await fetch( '/api/auth/passkey/list' )
			if ( !response.ok ) throw new Error( 'Failed to fetch passkeys' )
			const data=await response.json()
			setPasskeys( data.passkeys??[] )
		} catch ( error ) {
			console.error( 'Error fetching passkeys:',error )
			setPasskeys( [] )
		}
	},[] )

	useEffect( () => {
		if ( session?.user?.id ) loadPasskeys()
	},[ session?.user?.id,loadPasskeys ] )

	const handleSave=async ( event: React.FormEvent ) => {
		event.preventDefault()
		setIsSaving( true )

		try {
			const response=await fetch( '/api/profile/update',{
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify( { name } ),
			} )

			if ( !response.ok ) {
				const data=await response.json()
				throw new Error( data.error||'Failed to update profile' )
			}

			const updated=await response.json()
			await update( { ...session,user: { ...session?.user,name: updated.name } } )
			toast( { title: 'Profile updated',description: 'Your name has been saved.' } )
		} catch ( error ) {
			toast( {
				title: 'Could not save',
				description: error instanceof Error? error.message:'Please try again.',
				variant: 'destructive',
			} )
		} finally {
			setIsSaving( false )
		}
	}

	const handleAddPasskey=async () => {
		try {
			await registerPasskey( session?.user?.email??undefined,session?.user?.name??undefined )
			toast( { title: 'Passkey added',description: 'You can now sign in without typing.' } )
			await loadPasskeys()
		} catch ( error ) {
			console.error( 'Passkey registration error:',error )
			toast( {
				title: 'Could not add passkey',
				description: 'Your browser or device declined the request.',
				variant: 'destructive',
			} )
		}
	}

	const handleRemovePasskey=async ( id: string ) => {
		if ( !confirm( 'Remove this passkey? You will not be able to sign in with it again.' ) ) return

		try {
			const response=await fetch( `/api/auth/passkey/${id}`,{ method: 'DELETE' } )
			if ( !response.ok ) throw new Error( 'Failed to remove passkey' )
			await loadPasskeys()
		} catch ( error ) {
			console.error( 'Error removing passkey:',error )
			toast( {
				title: 'Could not remove passkey',
				description: 'Please try again.',
				variant: 'destructive',
			} )
		}
	}

	const handleChangeMaster=async ( event: React.FormEvent ) => {
		event.preventDefault()

		if ( masterPassword.length<12 ) {
			toast( {
				title: 'Too short',
				description: 'A master password must be at least 12 characters.',
				variant: 'destructive',
			} )
			return
		}

		try {
			await setupMasterPassword( masterPassword )
			setMasterPassword( '' )
			setIsChangingMaster( false )
			toast( { title: 'Master password changed',description: 'Keep it somewhere safe — it cannot be reset.' } )
		} catch ( error ) {
			console.error( 'Master password error:',error )
			toast( {
				title: 'Could not change it',
				description: 'Please try again.',
				variant: 'destructive',
			} )
		}
	}

	if ( status==='loading' ) {
		return (
			<div className="min-h-screen bg-bg px-8 pt-7 text-fg">
				<div className="skeleton h-3 w-16" />
				<div className="skeleton mt-3 h-[31px] w-64" />
			</div>
		)
	}

	if ( !session?.user ) return null

	return (
		<div className="min-h-screen bg-bg px-8 pt-7 pb-8 text-fg">
			<DashboardHeader
				eyebrow="profile"
				title={session.user.name||session.user.email||'Your account'}
				action={
					<Button variant="ghost" className="border border-br" onClick={() => router.push( '/dashboard' )}>
						← back to pipeline
					</Button>
				}
			/>

			<div className="mt-[26px] grid grid-cols-1 gap-[26px] lg:grid-cols-2">
				<Panel title="account">
					<form onSubmit={handleSave} className="flex flex-col gap-[18px] p-5">
						<div>
							<label htmlFor="name" className={labelClass}>name</label>
							<input
								id="name"
								value={name}
								onChange={event => setName( event.target.value )}
								className={fieldClass}
							/>
						</div>

						<div>
							<div className={labelClass}>email</div>
							<div className="mt-2 border border-br p-[13px] text-[13px] text-dim">
								{session.user.email}
							</div>
						</div>

						<div>
							<div className={labelClass}>tracked</div>
							<div className="mt-2 text-[13px] text-dim">
								{applications.length} application{applications.length===1? '':'s'} logged
							</div>
						</div>

						<Button type="submit" className="self-start" disabled={isSaving}>
							{isSaving? 'saving…':'save changes'}
						</Button>
					</form>
				</Panel>

				<div className="flex flex-col gap-4">
					<Panel
						title="passkeys"
						note={
							<span className={passkeys?.length? 'text-ac':'text-dim'}>
								{passkeys===null
									? '…'
									:`${passkeys.length} registered`}
							</span>
						}
					>
						<div className="px-5 pt-1.5 pb-4">
							{passkeys===null? (
								<div className="skeleton my-3.5 h-4 w-2/3" />
							):passkeys.length===0? (
								<div className="py-3.5 text-[12.5px] leading-[1.8] text-dim">
									No passkeys yet. Adding one lets you sign in without typing a password.
								</div>
							):(
								passkeys.map( ( passkey,index ) => (
									<div
										key={passkey.id}
										className={cn(
											'flex justify-between gap-4 py-3.5',
											index<passkeys.length-1&&'row-rule'
										)}
									>
										<div className="min-w-0">
											<div className="truncate">{passkey.name||'Unnamed device'}</div>
											<div className="mt-[5px] text-[11.5px] text-dim">
												{( passkey.deviceType??'single_device' ).replace( '_','-' )} · added{' '}
												{formatShortDate( passkey.createdAt )}
												{passkey.lastUsed? ` · last used ${formatShortDate( passkey.lastUsed )}`:''}
											</div>
										</div>
										<button
											type="button"
											onClick={() => handleRemovePasskey( passkey.id )}
											className="flex-none self-start text-[12px] text-dim transition-colors hover:text-dg"
										>
											remove
										</button>
									</div>
								) )
							)}

							{isSupported&&(
								<Button variant="outline" className="mt-3.5" onClick={handleAddPasskey}>
									+ add passkey
								</Button>
							)}
						</div>
					</Panel>

					<Panel title="encryption">
						<div className="px-5 py-[18px]">
							<div className="text-[12.5px] leading-[1.8] text-dim">
								Your applications and notes are encrypted with a key derived from your master
								password. Changing it re-encrypts everything on this device.
							</div>

							{isChangingMaster? (
								<form onSubmit={handleChangeMaster} className="mt-3.5">
									<input
										type="password"
										value={masterPassword}
										onChange={event => setMasterPassword( event.target.value )}
										placeholder="new master password, 12+ characters"
										autoComplete="new-password"
										className={cn( fieldClass,'mt-0' )}
									/>
									<div className="mt-3 flex gap-2.5">
										<Button type="submit" size="sm">save</Button>
										<Button
											type="button"
											size="sm"
											variant="ghost"
											className="border border-br"
											onClick={() => {
												setIsChangingMaster( false )
												setMasterPassword( '' )
											}}
										>
											cancel
										</Button>
									</div>
								</form>
							):(
								<Button variant="outline" className="mt-3.5" onClick={() => setIsChangingMaster( true )}>
									change master password
								</Button>
							)}
						</div>
					</Panel>
				</div>
			</div>

			<div className="mt-[26px] grid grid-cols-1 border border-br lg:grid-cols-2">
				<div className="border-b border-br p-5 lg:border-r lg:border-b-0">
					<div className="text-[10.5px] uppercase tracking-[.12em] text-dim">your data</div>
					<div className="mt-3 text-[12.5px] leading-[1.8] text-dim">
						Export every application, company and document reference as CSV or JSON.
					</div>
					<div className="mt-3.5 flex flex-wrap gap-2.5">
						<Button variant="outline" onClick={() => setIsExportOpen( true )}>export data</Button>
					</div>
				</div>

				<div className="p-5">
					<div className="text-[10.5px] uppercase tracking-[.12em] text-wn">danger zone</div>
					<div className="mt-3 text-[12.5px] leading-[1.8] text-dim">
						Deleting your account would remove all {applications.length} application
						{applications.length===1? '':'s'} and everything attached to them. There is no endpoint
						for this yet, so it has to be done by hand.
					</div>
					<Button variant="warning" className="mt-3.5" disabled title="No account-deletion endpoint exists">
						delete account
					</Button>
				</div>
			</div>

			<ExportDataDialog open={isExportOpen} onOpenChange={setIsExportOpen} />
		</div>
	)
}
