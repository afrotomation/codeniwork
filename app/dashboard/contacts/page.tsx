'use client'

import { DashboardHeader } from '@/components/dashboard/header'
import { Button } from '@/components/ui/button'
import { formatShortDate } from '@/lib/applications'
import { cn } from '@/lib/utils'
import { useEffect,useMemo,useRef,useState } from 'react'

/**
 * There is no contacts table in the schema, so this register runs on the same
 * sample set the previous screen used. Wiring it to real data needs a
 * `contacts` table plus its API route; nothing else here would change.
 */
const contacts=[
	{
		id: 1,
		name: 'Sarah Johnson',
		title: 'Senior Recruiter',
		company: 'TechCorp Solutions',
		email: 'sarah.johnson@techcorp.com',
		phone: '+1 (555) 123-4567',
		location: 'San Francisco, CA',
		relationship: 'recruiter',
		lastContact: '2026-01-08',
		status: 'active',
		notes: 'Met at TechCrunch conference. Very responsive and helpful.'
	},
	{
		id: 2,
		name: 'Michael Chen',
		title: 'Engineering Manager',
		company: 'InnovateLab',
		email: 'mchen@innovatelab.ai',
		phone: '+1 (555) 987-6543',
		location: 'New York, NY',
		relationship: 'hiring manager',
		lastContact: '2026-01-05',
		status: 'active',
		notes: 'Direct hiring manager for the role I applied to.'
	},
	{
		id: 3,
		name: 'Emily Rodriguez',
		title: 'Talent Acquisition',
		company: 'DataFlow Systems',
		email: 'emily.rodriguez@dataflow.io',
		phone: '+1 (555) 456-7890',
		location: 'Austin, TX',
		relationship: 'recruiter',
		lastContact: '2026-01-03',
		status: 'active',
		notes: 'Great communication throughout the process.'
	},
	{
		id: 4,
		name: 'David Kim',
		title: 'CTO',
		company: 'CloudScale Inc',
		email: 'david.kim@cloudscale.com',
		phone: '+1 (555) 789-0123',
		location: 'Seattle, WA',
		relationship: 'executive',
		lastContact: '2025-12-20',
		status: 'inactive',
		notes: 'Met at AWS re:Invent. Interested in cloud expertise.'
	},
	{
		id: 5,
		name: 'Lisa Thompson',
		title: 'HR Director',
		company: 'StartupXYZ',
		email: 'lisa.thompson@startupxyz.com',
		phone: '+1 (555) 321-6540',
		location: 'Boston, MA',
		relationship: 'HR contact',
		lastContact: '2026-01-10',
		status: 'active',
		notes: 'New contact from recent application. Asked for a portfolio link by end of week.'
	}
]

/** Design column rhythm: name/role, relationship, company, last contact, status. */
const COLUMNS='grid-cols-[1fr_150px_130px_118px_96px]'

/** Contacts spoken to inside this window count as recent. */
const RECENT_DAYS=7

export default function ContactsPage () {
	const [ query,setQuery ]=useState( '' )
	const [ selectedId,setSelectedId ]=useState<number>( contacts[ 0 ].id )
	const inputRef=useRef<HTMLInputElement>( null )

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
			if ( inField||event.key!=='/' ) return

			event.preventDefault()
			inputRef.current?.focus()
		}

		window.addEventListener( 'keydown',onKeyDown )
		return () => window.removeEventListener( 'keydown',onKeyDown )
	},[] )

	// Last contact drives the order — the coldest thread is the one to notice.
	const ordered=useMemo( () => {
		const needle=query.trim().toLowerCase()
		return contacts
			.filter( contact => {
				if ( !needle ) return true
				return `${contact.name} ${contact.title} ${contact.company} ${contact.email}`
					.toLowerCase()
					.includes( needle )
			} )
			.sort( ( a,b ) => new Date( b.lastContact ).getTime()-new Date( a.lastContact ).getTime() )
	},[ query ] )

	const active=contacts.filter( contact => contact.status==='active' ).length
	const inactive=contacts.length-active
	const selected=contacts.find( contact => contact.id===selectedId )??contacts[ 0 ]

	// "spoke this week" is relative to the most recent contact in the set, so the
	// sample data still reads sensibly whenever this is opened.
	const recent=useMemo( () => {
		const latest=Math.max( ...contacts.map( c => new Date( c.lastContact ).getTime() ) )
		const cutoff=latest-RECENT_DAYS*86_400_000
		return contacts.filter( c => new Date( c.lastContact ).getTime()>=cutoff ).length
	},[] )

	return (
		<div>
			<DashboardHeader
				eyebrow="contacts"
				title={`${contacts.length} people, ${recent} spoke this week`}
				align="end"
				action={<Button disabled title="Needs a contacts table">+ add contact</Button>}
			/>

			<div className="mt-6 flex items-center border border-br">
				<span className="border-r border-br px-3.5 py-[13px] text-ac">/</span>
				<input
					ref={inputRef}
					value={query}
					onChange={event => setQuery( event.target.value )}
					placeholder="search contacts"
					spellCheck={false}
					aria-label="Search contacts"
					className="flex-1 bg-transparent px-3.5 py-[13px] font-mono text-[13px] text-fg placeholder:text-dim focus:outline-none"
				/>
				<span className="border-l border-br px-3.5 py-[13px] text-[11.5px] text-dim">
					{active} active · {inactive} inactive
				</span>
			</div>

			<div className={cn( 'label mt-[26px] grid border-b border-br pb-2.5',COLUMNS )}>
				<div>name / role</div>
				<div>relationship</div>
				<div>company</div>
				<div>last contact</div>
				<div>status</div>
			</div>

			{ordered.length===0? (
				<div className="border-b border-br py-10 text-center text-[12.5px] text-dim">
					Nobody matches that search.
				</div>
			):(
				ordered.map( contact => {
					const isInactive=contact.status!=='active'
					return (
						<button
							key={contact.id}
							type="button"
							onClick={() => setSelectedId( contact.id )}
							className={cn(
								'row-rule grid w-full items-center py-[17px] text-left text-[13px] transition-colors',
								COLUMNS,
								isInactive&&'opacity-50',
								selectedId===contact.id? 'bg-ft':'hover:bg-ft'
							)}
						>
							<div className="truncate pr-4">
								<span className="display text-[14.5px] text-fg">{contact.name}</span>
								<div className="mt-[5px] text-[11.5px] text-dim">
									{contact.title} · {contact.email}
								</div>
							</div>
							<div className="text-dim">{contact.relationship}</div>
							<div className="text-dim">{contact.company}</div>
							<div className="text-fg">{formatShortDate( contact.lastContact )}</div>
							<div className={isInactive? 'text-dim':'text-ac'}>{contact.status}</div>
						</button>
					)
				} )
			)}

			<div className="mt-[26px] border border-br px-5 py-[18px]">
				<div className="text-[10.5px] uppercase tracking-[.12em] text-dim">
					notes on {selected.name}
				</div>
				<div className="mt-3 text-[12.5px] leading-[1.8] text-dim">{selected.notes}</div>
				<div className="mt-4 flex flex-wrap gap-2.5">
					<Button size="sm" asChild>
						<a href={`mailto:${selected.email}`}>email</a>
					</Button>
					<Button size="sm" variant="outline" disabled title="Needs a contacts table">
						schedule follow-up
					</Button>
				</div>
			</div>
		</div>
	)
}
