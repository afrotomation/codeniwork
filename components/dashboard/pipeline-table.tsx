'use client'

import {
	formatShortDate,
	getNextStep,
	isOpen,
	type JobApplication,
	type NextStepTone,
} from '@/lib/applications'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { useEffect,useState } from 'react'

/** Design column rhythm: index, role, stage, applied, comp, next. */
const COLUMNS='grid-cols-[32px_1fr_112px_88px_120px_128px]'

const toneClass: Record<NextStepTone,string>={
	accent: 'text-ac',
	warn: 'text-wn',
	dim: 'text-dim',
	plain: 'text-fg',
}

/** Stages that have earned the accent. */
const LIVE_STAGES=[ 'interview','offer' ]

interface PipelineTableProps {
	applications: JobApplication[]
	isLoading?: boolean
	/** How many rows the strip shows before deferring to /dashboard/applications. */
	limit?: number
}

/**
 * The pipeline as a table, most urgent first. j / k move the selection and
 * enter opens the selected row on the applications screen.
 */
export function PipelineTable ( { applications,isLoading,limit=7 }: PipelineTableProps ) {
	const router=useRouter()
	const [ selected,setSelected ]=useState( 0 )

	// Open work first, and within it whatever is closest to needing an answer.
	const ordered=[ ...applications ].sort( ( a,b ) => {
		const aOpen=isOpen( a )
		const bOpen=isOpen( b )
		if ( aOpen!==bOpen ) return aOpen? -1:1

		const aDays=getNextStep( a ).days
		const bDays=getNextStep( b ).days
		if ( aDays===null ) return bDays===null? 0:1
		if ( bDays===null ) return -1
		return aDays-bDays
	} )

	const rows=ordered.slice( 0,limit )
	const rowIds=rows.map( row => row.id ).join( ',' )

	useEffect( () => {
		if ( rows.length===0 ) return

		const onKeyDown=( event: KeyboardEvent ) => {
			if ( event.metaKey||event.ctrlKey||event.altKey ) return

			const target=event.target as HTMLElement|null
			if ( target?.isContentEditable ) return
			if ( target&&/^(INPUT|TEXTAREA|SELECT)$/.test( target.tagName ) ) return

			if ( event.key==='j' ) {
				event.preventDefault()
				setSelected( current => Math.min( current+1,rows.length-1 ) )
			} else if ( event.key==='k' ) {
				event.preventDefault()
				setSelected( current => Math.max( current-1,0 ) )
			} else if ( event.key==='Enter' ) {
				const app=rows[ selected ]
				if ( !app ) return
				event.preventDefault()
				router.push( `/dashboard/applications?open=${app.id}` )
			}
		}

		window.addEventListener( 'keydown',onKeyDown )
		return () => window.removeEventListener( 'keydown',onKeyDown )
		// rowIds stands in for rows, which is a fresh array on every render.
	},[ rowIds,selected,router ] )

	if ( isLoading ) {
		return (
			<div className="mt-7">
				<div className={cn( 'label grid border-b border-br pb-2.5',COLUMNS )}>
					<div>#</div><div>role / company</div><div>stage</div>
					<div>applied</div><div>comp</div><div>next</div>
				</div>
				{Array.from( { length: 5 } ).map( ( _,i ) => (
					<div key={i} className={cn( 'grid items-center py-4 row-rule',COLUMNS )}>
						<div className="skeleton h-3 w-4" />
						<div className="skeleton h-3.5 w-2/3" />
						<div className="skeleton h-3 w-14" />
						<div className="skeleton h-3 w-12" />
						<div className="skeleton h-3 w-16" />
						<div className="skeleton h-3 w-20" />
					</div>
				) )}
			</div>
		)
	}

	if ( applications.length===0 ) {
		return (
			<div className="mt-7 border border-br px-5 py-10 text-center">
				<div className="display text-lg text-fg">Nothing tracked yet</div>
				<p className="mt-2 text-[12.5px] text-dim">
					Add the first application to start the pipeline.
				</p>
			</div>
		)
	}

	return (
		<div className="mt-7">
			<div className={cn( 'label grid border-b border-br pb-2.5',COLUMNS )}>
				<div>#</div>
				<div>role / company</div>
				<div>stage</div>
				<div>applied</div>
				<div>comp</div>
				<div>next</div>
			</div>

			{rows.map( ( app,index ) => {
				const next=getNextStep( app )
				const open=isOpen( app )
				const isSelected=index===selected

				return (
					<button
						key={app.id}
						type="button"
						onClick={() => {
							setSelected( index )
							router.push( `/dashboard/applications?open=${app.id}` )
						}}
						className={cn(
							'row-rule grid w-full items-center py-4 text-left text-[13px] transition-colors',
							COLUMNS,
							isSelected&&'bg-ft',
							!open&&'opacity-45',
							open&&!isSelected&&'hover:bg-ft'
						)}
					>
						<div className="text-dim opacity-70">{String( index+1 ).padStart( 2,'0' )}</div>

						<div className="truncate pr-4">
							<span className="display text-[14px] text-fg">{app.position}</span>
							<span className="text-dim">&nbsp;&nbsp;{app.company.name.toLowerCase()}</span>
						</div>

						<div className={LIVE_STAGES.includes( app.status )? 'text-ac':'text-fg'}>
							{app.status}
						</div>

						<div className="text-dim">{formatShortDate( app.appliedAt )}</div>

						<div className={app.salary? 'text-fg':'text-dim opacity-60'}>
							{app.salary??'—'}
						</div>

						<div className={toneClass[ next.tone ]}>{next.label}</div>
					</button>
				)
			} )}

			<div className="mt-[18px] text-[12px] text-dim">
				{rows.length} / {applications.length} shown · <span className="text-ac">j k</span> to move ·{' '}
				<span className="text-ac">enter</span> to open
			</div>
		</div>
	)
}
