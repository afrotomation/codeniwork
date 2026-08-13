'use client'

import { AddApplicationDialog } from '@/components/dashboard/add-application-dialog'
import { ExportDataDialog } from '@/components/dashboard/export-data-dialog'
import { DashboardHeader } from '@/components/dashboard/header'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { ScheduleFollowupDialog } from '@/components/dashboard/schedule-followup-dialog'
import { UploadDocumentDialog } from '@/components/dashboard/upload-document-dialog'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { useEffect,useMemo,useRef,useState } from 'react'

type CommandId=
	|'add-application'
	|'view-applications'
	|'update-status'
	|'upload-resume'
	|'create-cover-letter'
	|'update-portfolio'
	|'add-contact'
	|'schedule-followup'
	|'send-thankyou'
	|'view-analytics'
	|'export-data'
	|'auto-reject'

interface Command {
	id: CommandId
	title: string
	description: string
	shortcut: string
	/** Commands with nothing behind them yet are listed but not offered. */
	disabled?: boolean
}

const groups: { label: string; commands: Command[] }[]=[
	{
		label: 'applications',
		commands: [
			{ id: 'add-application',title: 'Add new application',description: 'Track a new job application',shortcut: '⌘N' },
			{ id: 'view-applications',title: 'View applications',description: 'See all your applications',shortcut: '⌘A' },
			{ id: 'update-status',title: 'Update status',description: 'Move an application forward',shortcut: '⌘U' },
		],
	},
	{
		label: 'documents',
		commands: [
			{ id: 'upload-resume',title: 'Upload resume',description: 'Add a new resume version',shortcut: '⌘R' },
			{ id: 'create-cover-letter',title: 'Create cover letter',description: 'Write or generate a new one',shortcut: '⌘L' },
			{ id: 'update-portfolio',title: 'Update portfolio',description: 'Refresh your portfolio file',shortcut: '⌘P' },
		],
	},
	{
		label: 'networking',
		commands: [
			{ id: 'add-contact',title: 'Add new contact',description: 'Needs a contacts table',shortcut: '⌘C',disabled: true },
			{ id: 'schedule-followup',title: 'Schedule follow-up',description: 'Set a reminder for a contact',shortcut: '⌘F' },
			{ id: 'send-thankyou',title: 'Send thank you',description: 'Follow up after an interview',shortcut: '⌘T' },
		],
	},
	{
		label: 'analytics & tools',
		commands: [
			{ id: 'view-analytics',title: 'View analytics',description: 'Track your progress',shortcut: '⌘G' },
			{ id: 'export-data',title: 'Export data',description: 'Download everything as CSV or JSON',shortcut: '⌘E' },
			{ id: 'auto-reject',title: 'Auto-reject old applications',description: 'Close anything silent for 21 days',shortcut: '⌘J' },
		],
	},
]

export default function QuickActionsPage () {
	const router=useRouter()
	const { toast }=useToast()
	const [ query,setQuery ]=useState( '' )
	const inputRef=useRef<HTMLInputElement>( null )

	const [ isAddOpen,setIsAddOpen ]=useState( false )
	const [ isUploadOpen,setIsUploadOpen ]=useState( false )
	const [ uploadType,setUploadType ]=useState<string|undefined>( undefined )
	const [ isFollowupOpen,setIsFollowupOpen ]=useState( false )
	const [ isExportOpen,setIsExportOpen ]=useState( false )

	// ⌘K focuses the command line from anywhere on this screen.
	useEffect( () => {
		const onKeyDown=( event: KeyboardEvent ) => {
			if ( ( event.metaKey||event.ctrlKey )&&event.key==='k' ) {
				event.preventDefault()
				inputRef.current?.focus()
				return
			}
			if ( event.key==='Escape' ) inputRef.current?.blur()
		}

		window.addEventListener( 'keydown',onKeyDown )
		return () => window.removeEventListener( 'keydown',onKeyDown )
	},[] )

	const runAutoReject=async () => {
		try {
			const response=await fetch( '/api/dashboard/applications/auto-reject',{ method: 'POST' } )
			if ( !response.ok ) throw new Error( 'Failed to run auto-rejection' )

			const result=await response.json()
			toast( {
				title: 'Auto-rejection complete',
				description: `${result.rejectedCount} application${result.rejectedCount===1? '':'s'} closed.`,
			} )
		} catch ( error ) {
			console.error( 'Error running auto-rejection:',error )
			toast( {
				title: 'Auto-rejection failed',
				description: 'Check the console for details.',
				variant: 'destructive',
			} )
		}
	}

	const run=async ( id: CommandId ) => {
		switch ( id ) {
			case 'add-application':
				setIsAddOpen( true )
				break
			case 'view-applications':
			case 'update-status':
				router.push( '/dashboard/applications' )
				break
			case 'upload-resume':
				setUploadType( 'resume' )
				setIsUploadOpen( true )
				break
			case 'create-cover-letter':
				router.push( '/dashboard/ai-tools' )
				break
			case 'update-portfolio':
				setUploadType( 'portfolio' )
				setIsUploadOpen( true )
				break
			case 'schedule-followup':
				setIsFollowupOpen( true )
				break
			case 'send-thankyou':
				router.push( '/dashboard/contacts' )
				break
			case 'view-analytics':
				router.push( '/dashboard/analytics' )
				break
			case 'export-data':
				setIsExportOpen( true )
				break
			case 'auto-reject':
				await runAutoReject()
				break
			default:
				break
		}
	}

	const filtered=useMemo( () => {
		const needle=query.trim().toLowerCase()
		if ( !needle ) return groups

		return groups
			.map( group => ( {
				...group,
				commands: group.commands.filter( command =>
					`${command.title} ${command.description} ${group.label}`.toLowerCase().includes( needle )
				),
			} ) )
			.filter( group => group.commands.length>0 )
	},[ query ] )

	const columns=[
		filtered.filter( ( _,index ) => index%2===0 ),
		filtered.filter( ( _,index ) => index%2===1 ),
	]

	return (
		<div>
			<DashboardHeader eyebrow="quick actions" title="Everything by keystroke" />

			<div className="mt-6 flex items-center border border-br">
				<span className="border-r border-br px-3.5 py-[13px] text-ac">⌘K</span>
				<input
					ref={inputRef}
					value={query}
					onChange={event => setQuery( event.target.value )}
					placeholder="type a command…"
					spellCheck={false}
					aria-label="Filter commands"
					className="flex-1 bg-transparent px-3.5 py-[13px] font-mono text-[13px] text-fg placeholder:text-dim focus:outline-none"
				/>
			</div>

			{filtered.length===0? (
				<div className="mt-[26px] border border-br py-10 text-center text-[12.5px] text-dim">
					No command matches that.
				</div>
			):(
				<div className="mt-[26px] grid grid-cols-1 gap-[26px] lg:grid-cols-2">
					{columns.map( ( column,columnIndex ) => (
						<div key={columnIndex}>
							{column.map( ( group,groupIndex ) => (
								<div key={group.label} className={groupIndex>0? 'mt-[26px]':undefined}>
									<div className="text-[10.5px] uppercase tracking-[.12em] text-dim">
										{group.label}
									</div>
									<div className="mt-3 border-t border-br">
										{group.commands.map( command => (
											<button
												key={command.id}
												type="button"
												disabled={command.disabled}
												onClick={() => run( command.id )}
												title={command.disabled? command.description:undefined}
												className={cn(
													'row-rule flex w-full justify-between gap-4 py-3.5 text-left transition-colors',
													command.disabled? 'cursor-not-allowed opacity-45':'hover:bg-ft'
												)}
											>
												<span>
													<span className="block text-[13px]">{command.title}</span>
													<span className="mt-[5px] block text-[11.5px] text-dim">
														{command.description}
													</span>
												</span>
												<span className="flex-none self-center text-[12px] text-dim">
													{command.shortcut}
												</span>
											</button>
										) )}
									</div>
								</div>
							) )}
						</div>
					) )}
				</div>
			)}

			<RecentActivity limit={5} />

			<AddApplicationDialog open={isAddOpen} onOpenChange={setIsAddOpen} />
			<UploadDocumentDialog
				open={isUploadOpen}
				onOpenChange={setIsUploadOpen}
				onDocumentUploaded={async () => {}}
				presetDocumentType={uploadType}
			/>
			<ScheduleFollowupDialog open={isFollowupOpen} onOpenChange={setIsFollowupOpen} />
			<ExportDataDialog open={isExportOpen} onOpenChange={setIsExportOpen} />
		</div>
	)
}
