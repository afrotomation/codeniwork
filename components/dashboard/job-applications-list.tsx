'use client'

import { ApplicationDetail } from '@/components/dashboard/application-detail'
import { EditApplicationDialog } from '@/components/dashboard/edit-application-dialog'
import {
	formatShortDate,
	getNextStep,
	getPipelineStats,
	isOpen,
	type JobApplication,
} from '@/lib/applications'
import { cn } from '@/lib/utils'
import { useRouter,useSearchParams } from 'next/navigation'
import { useEffect,useMemo,useRef,useState } from 'react'

/** Design column rhythm: role, stage, priority, comp, applied, deadline. */
const COLUMNS='grid-cols-[1fr_108px_84px_116px_92px_96px]'

const LIVE_STAGES=[ 'interview','offer' ]

interface JobApplicationsListProps {
	applications: JobApplication[]
	isLoading?: boolean
	onRefresh?: () => Promise<void>
}

/* ── Query language ────────────────────────────────────────────
   The filter bar is a command line, not a form. `stage:` narrows,
   `remote:` narrows, `sort:` reorders, anything else is free text
   matched against role and company. */

interface ParsedQuery {
	stage: string|null
	remoteOnly: boolean
	sort: 'next-step'|'applied'|'comp'
	text: string
}

function parseQuery ( raw: string ): ParsedQuery {
	const parsed: ParsedQuery={ stage: null,remoteOnly: false,sort: 'next-step',text: '' }
	const words: string[]=[]

	for ( const token of raw.trim().split( /\s+/ ).filter( Boolean ) ) {
		const [ key,...rest ]=token.split( ':' )
		const value=rest.join( ':' )

		if ( key==='stage'&&value ) parsed.stage=value.toLowerCase()
		else if ( key==='remote' ) parsed.remoteOnly=value!=='false'
		else if ( key==='sort'&&value ) {
			if ( value==='applied'||value==='comp'||value==='next-step' ) parsed.sort=value
		} else words.push( token )
	}

	parsed.text=words.join( ' ' ).toLowerCase()
	return parsed
}

function matchesStage ( app: JobApplication,stage: string|null ): boolean {
	if ( !stage||stage==='all' ) return true
	if ( stage==='open' ) return isOpen( app )
	if ( stage==='closed' ) return !isOpen( app )
	return app.status===stage
}

export function JobApplicationsList ( {
	applications,
	isLoading,
	onRefresh,
}: JobApplicationsListProps ) {
	const router=useRouter()
	const searchParams=useSearchParams()
	const requestedId=searchParams.get( 'open' )

	const [ query,setQuery ]=useState( 'stage:open sort:next-step' )
	const [ expandedId,setExpandedId ]=useState<string|null>( null )
	const [ editing,setEditing ]=useState<JobApplication|null>( null )
	const inputRef=useRef<HTMLInputElement>( null )

	// A row handed over from the pipeline table opens straight away.
	useEffect( () => {
		if ( !requestedId ) return
		setExpandedId( requestedId )
		setQuery( '' )
	},[ requestedId ] )

	useEffect( () => {
		const onKeyDown=( event: KeyboardEvent ) => {
			if ( event.metaKey||event.ctrlKey||event.altKey ) return

			const target=event.target as HTMLElement|null
			const inField=Boolean( target?.isContentEditable )
				||Boolean( target&&/^(INPUT|TEXTAREA|SELECT)$/.test( target.tagName ) )

			if ( event.key==='Escape'&&inField ) {
				inputRef.current?.blur()
				return
			}
			if ( inField ) return

			if ( event.key==='/' ) {
				event.preventDefault()
				inputRef.current?.focus()
			} else if ( event.key==='e'||event.key==='E' ) {
				const app=applications.find( item => item.id===expandedId )
				if ( !app ) return
				event.preventDefault()
				setEditing( app )
			}
		}

		window.addEventListener( 'keydown',onKeyDown )
		return () => window.removeEventListener( 'keydown',onKeyDown )
	},[ applications,expandedId ] )

	const stats=getPipelineStats( applications )
	const parsed=useMemo( () => parseQuery( query ),[ query ] )

	const results=useMemo( () => {
		const filtered=applications.filter( app => {
			if ( !matchesStage( app,parsed.stage ) ) return false
			if ( parsed.remoteOnly&&!app.isRemote ) return false
			if ( parsed.text ) {
				const haystack=`${app.position} ${app.company.name} ${app.location??''}`.toLowerCase()
				if ( !haystack.includes( parsed.text ) ) return false
			}
			return true
		} )

		return filtered.sort( ( a,b ) => {
			if ( parsed.sort==='applied' ) {
				return new Date( b.appliedAt ).getTime()-new Date( a.appliedAt ).getTime()
			}
			if ( parsed.sort==='comp' ) {
				return ( b.salary??'' ).localeCompare( a.salary??'' )
			}
			const aDays=getNextStep( a ).days
			const bDays=getNextStep( b ).days
			if ( aDays===null ) return bDays===null? 0:1
			if ( bDays===null ) return -1
			return aDays-bDays
		} )
	},[ applications,parsed ] )

	const chips: { label: string; query: string; active: boolean }[]=[
		{ label: `open ${stats.open}`,query: 'stage:open sort:next-step',active: parsed.stage==='open'&&!parsed.remoteOnly },
		{ label: `applied ${stats.applied}`,query: 'stage:applied',active: parsed.stage==='applied' },
		{ label: `screening ${stats.screening}`,query: 'stage:screening',active: parsed.stage==='screening' },
		{ label: `interview ${stats.interview}`,query: 'stage:interview',active: parsed.stage==='interview' },
		{ label: `offer ${stats.offer}`,query: 'stage:offer',active: parsed.stage==='offer' },
		{ label: `closed ${stats.closed}`,query: 'stage:closed',active: parsed.stage==='closed' },
		{ label: 'remote only',query: 'stage:open remote:true',active: parsed.remoteOnly },
	]

	const toggleRow = ( id: string ) => {
		setExpandedId( current => ( current===id? null:id ) )
		// The deep link has been consumed; keep the URL honest.
		if ( requestedId ) router.replace( '/dashboard/applications' )
	}

	const changeStatus=async ( app: JobApplication,status: 'offer'|'rejected'|'withdrawn' ) => {
		// The update endpoint validates the whole record, so resend it intact.
		if ( !app.location ) {
			setEditing( app )
			return
		}

		try {
			const response=await fetch( `/api/dashboard/applications/${app.id}`,{
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify( {
					companyName: app.company.name,
					position: app.position,
					jobUrl: app.jobUrl??'',
					location: app.location,
					salary: app.salary??undefined,
					notes: app.notes??undefined,
					priority: ( app.priority??'medium' ) as 'low'|'medium'|'high',
					isRemote: Boolean( app.isRemote ),
					status,
					deadline: app.deadline? new Date( app.deadline ).toISOString():undefined,
				} ),
			} )
			if ( !response.ok ) throw new Error( 'Failed to update application' )
			await onRefresh?.()
		} catch ( error ) {
			console.error( 'Error updating application status:',error )
		}
	}

	if ( isLoading ) {
		return (
			<div className="mt-6">
				<div className="skeleton h-[45px] w-full" />
				<div className="mt-6 space-y-4">
					{Array.from( { length: 6 } ).map( ( _,i ) => (
						<div key={i} className="skeleton h-5 w-full" />
					) )}
				</div>
			</div>
		)
	}

	return (
		<>
			<div className="mt-6 flex items-center border border-br">
				<span className="border-r border-br px-3.5 py-[13px] text-ac">/</span>
				<input
					ref={inputRef}
					value={query}
					onChange={event => setQuery( event.target.value )}
					placeholder="stage:open sort:next-step"
					spellCheck={false}
					aria-label="Filter applications"
					className="flex-1 bg-transparent px-3.5 py-[13px] font-mono text-[13px] text-fg placeholder:text-dim focus:outline-none"
				/>
				<span className="border-l border-br px-3.5 py-[13px] text-[11.5px] text-dim">
					{results.length} result{results.length===1? '':'s'}
				</span>
			</div>

			<div className="mt-3.5 flex flex-wrap gap-2">
				{chips.map( chip => (
					<button
						key={chip.label}
						type="button"
						onClick={() => setQuery( chip.query )}
						className={cn(
							'border px-3 py-[7px] text-[11.5px] transition-colors',
							chip.active
								? 'border-ac text-ac'
								:'border-br text-dim hover:border-ac hover:text-ac'
						)}
					>
						{chip.label}
					</button>
				) )}
			</div>

			<div className={cn( 'label mt-[26px] grid border-b border-br pb-2.5',COLUMNS )}>
				<div>role / company</div>
				<div>stage</div>
				<div>priority</div>
				<div>comp</div>
				<div>applied</div>
				<div>deadline</div>
			</div>

			{results.length===0? (
				<div className="border-b border-br py-10 text-center text-[12.5px] text-dim">
					Nothing matches that filter.
				</div>
			):(
				results.map( app => {
					const expanded=expandedId===app.id
					const next=getNextStep( app )
					const open=isOpen( app )
					const overdue=app.deadline!==null&&next.days!==null&&next.days<0
					const near=next.days!==null&&next.days>=0&&next.days<=7

					return (
						<div
							key={app.id}
							className={cn(
								expanded? 'border-b border-ac bg-ft':'row-rule',
								!open&&!expanded&&'opacity-45'
							)}
						>
							<button
								type="button"
								onClick={() => toggleRow( app.id )}
								aria-expanded={expanded}
								className={cn(
									'grid w-full items-center py-4 text-left text-[13px] transition-colors',
									COLUMNS,
									!expanded&&'hover:bg-ft'
								)}
							>
								<div className="truncate pr-4">
									<span className="display text-[14px] text-fg">{app.position}</span>
									<span className="text-dim">
										&nbsp;&nbsp;{app.company.name.toLowerCase()}
										{app.isRemote? ' · remote':app.location? ` · ${app.location.toLowerCase()}`:''}
									</span>
								</div>

								<div className={LIVE_STAGES.includes( app.status )? 'text-ac':'text-fg'}>
									{app.status}
								</div>

								<div className="text-fg">{app.priority??'—'}</div>

								<div className={app.salary? 'text-fg':'text-dim opacity-60'}>
									{app.salary??'—'}
								</div>

								<div className="text-dim">{formatShortDate( app.appliedAt )}</div>

								{/* This column is the deadline itself — a missed one says so,
								    a near one is accented, an absent one stays blank. */}
								<div
									className={cn(
										!app.deadline&&'text-dim opacity-60',
										app.deadline&&overdue&&'text-wn',
										app.deadline&&!overdue&&near&&'text-ac',
										app.deadline&&!overdue&&!near&&'text-fg'
									)}
								>
									{!app.deadline
										? '—'
										:overdue
											? 'overdue'
											:formatShortDate( app.deadline )}
								</div>
							</button>

							{expanded&&(
								<ApplicationDetail
									application={app}
									onEdit={() => setEditing( app )}
									onStatusChange={status => changeStatus( app,status )}
								/>
							)}
						</div>
					)
				} )
			)}

			<div className="mt-[18px] flex justify-between text-[12px] text-dim">
				<span>
					{results.length} / {applications.length} shown
				</span>
				{parsed.stage!=='closed'&&stats.closed>0&&(
					<button
						type="button"
						onClick={() => setQuery( 'stage:closed' )}
						className="text-ac hover:underline"
					>
						show {stats.closed} closed
					</button>
				)}
			</div>

			<EditApplicationDialog
				open={editing!==null}
				onOpenChange={next => {
					if ( !next ) setEditing( null )
				}}
				application={editing}
				onApplicationUpdated={async () => {
					await onRefresh?.()
				}}
			/>
		</>
	)
}
