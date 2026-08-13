'use client'

import { AddApplicationButton } from '@/components/dashboard/add-application-button'
import { EditCompanyDialog } from '@/components/dashboard/edit-company-dialog'
import { DashboardHeader } from '@/components/dashboard/header'
import { useApplications } from '@/hooks/use-applications'
import { cn } from '@/lib/utils'
import { useEffect,useMemo,useState } from 'react'

interface Company {
	id: string
	name: string
	website: string|null
	logo: string|null
	description: string|null
	location: string|null
	industry: string|null
	size: string|null
	applicationsCount: number
}

/** Design column rhythm: company, industry, location, size, apps, reply rate. */
const COLUMNS='grid-cols-[1fr_130px_118px_92px_92px_110px]'

/** How many rows before the register defers to "show all". */
const PREVIEW_ROWS=9

/** A reply is anything that moved past the initial send. */
const REPLIED_STAGES=[ 'screening','interview','offer' ]

function stripScheme ( website: string|null ): string {
	if ( !website ) return '—'
	return website.replace( /^https?:\/\//,'' ).replace( /\/$/,'' )
}

export default function CompaniesPage () {
	const { applications,refresh }=useApplications()
	const [ companies,setCompanies ]=useState<Company[]>( [] )
	const [ isLoading,setIsLoading ]=useState( true )
	const [ editing,setEditing ]=useState<Company|null>( null )
	const [ selected,setSelected ]=useState<string|null>( null )
	const [ showAll,setShowAll ]=useState( false )

	useEffect( () => {
		fetchCompanies()
	},[] )

	// E edits the selected row, as the rail promises.
	useEffect( () => {
		const onKeyDown=( event: KeyboardEvent ) => {
			if ( event.metaKey||event.ctrlKey||event.altKey ) return
			if ( event.key!=='e'&&event.key!=='E' ) return

			const target=event.target as HTMLElement|null
			if ( target?.isContentEditable ) return
			if ( target&&/^(INPUT|TEXTAREA|SELECT)$/.test( target.tagName ) ) return

			const company=companies.find( item => item.id===selected )
			if ( !company ) return
			event.preventDefault()
			setEditing( company )
		}

		window.addEventListener( 'keydown',onKeyDown )
		return () => window.removeEventListener( 'keydown',onKeyDown )
	},[ companies,selected ] )

	const fetchCompanies=async () => {
		try {
			const response=await fetch( '/api/dashboard/companies' )
			if ( !response.ok ) throw new Error( 'Failed to fetch companies' )
			setCompanies( await response.json() )
		} catch ( error ) {
			console.error( 'Error fetching companies:',error )
		} finally {
			setIsLoading( false )
		}
	}

	// Reply rate is a property of this user's applications, not of the company
	// record, so it is derived here rather than stored.
	const replyRates=useMemo( () => {
		const rates=new Map<string,number|null>()
		for ( const company of companies ) {
			const mine=applications.filter( app => app.company.id===company.id )
			if ( mine.length===0 ) {
				rates.set( company.id,null )
				continue
			}
			const replied=mine.filter( app => REPLIED_STAGES.includes( app.status ) ).length
			rates.set( company.id,Math.round( ( replied/mine.length )*100 ) )
		}
		return rates
	},[ companies,applications ] )

	const rows=showAll? companies:companies.slice( 0,PREVIEW_ROWS )
	const totalApplications=applications.length

	return (
		<div>
			<DashboardHeader
				eyebrow="companies"
				title={
					isLoading
						? 'Loading companies'
						:`${companies.length} ${companies.length===1? 'company':'companies'}, ${totalApplications} application${totalApplications===1? '':'s'}`
				}
				align="end"
				action={
					/* Companies are created through an application, not on their own —
					   there is no endpoint that adds a bare company record. */
					<AddApplicationButton
						variant="default"
						label="+ add company"
						onApplicationAdded={async () => {
							await refresh()
							await fetchCompanies()
						}}
					/>
				}
			/>

			<div className={cn( 'label mt-7 grid border-b border-br pb-2.5',COLUMNS )}>
				<div>company</div>
				<div>industry</div>
				<div>location</div>
				<div>size</div>
				<div>apps</div>
				<div>reply rate</div>
			</div>

			{isLoading? (
				Array.from( { length: 6 } ).map( ( _,i ) => (
					<div key={i} className={cn( 'row-rule grid items-center py-[17px]',COLUMNS )}>
						<div className="skeleton h-4 w-1/2" />
						<div className="skeleton h-3 w-20" />
						<div className="skeleton h-3 w-16" />
						<div className="skeleton h-3 w-10" />
						<div className="skeleton h-3 w-6" />
						<div className="skeleton h-3 w-12" />
					</div>
				) )
			):companies.length===0? (
				<div className="border-b border-br py-10 text-center text-[12.5px] text-dim">
					No companies yet. They are created with your first application.
				</div>
			):(
				rows.map( company => {
					const rate=replyRates.get( company.id )??null
					const isSelected=selected===company.id

					return (
						<button
							key={company.id}
							type="button"
							onClick={() => setSelected( company.id )}
							onDoubleClick={() => setEditing( company )}
							className={cn(
								'row-rule grid w-full items-center py-[17px] text-left text-[13px] transition-colors',
								COLUMNS,
								isSelected? 'bg-ft':'hover:bg-ft'
							)}
						>
							<div className="truncate pr-4">
								<span className="display text-[14.5px] text-fg">{company.name}</span>
								<div className="mt-[5px] text-[11.5px] text-dim">{stripScheme( company.website )}</div>
							</div>
							<div className="text-dim">{company.industry??'—'}</div>
							<div className="text-dim">{company.location??'—'}</div>
							<div className="text-dim">{company.size??'—'}</div>
							<div className="text-fg">{company.applicationsCount}</div>
							<div className={rate!==null&&rate>=50? 'text-ac':'text-dim'}>
								{rate===null? '—':`${rate}%`}
							</div>
						</button>
					)
				} )
			)}

			{companies.length>0&&(
				<div className="mt-[18px] text-[12px] text-dim">
					{rows.length} / {companies.length} shown
					{companies.length>PREVIEW_ROWS&&(
						<>
							{' · '}
							<button
								type="button"
								onClick={() => setShowAll( value => !value )}
								className="text-ac hover:underline"
							>
								{showAll? 'show fewer':'show all'}
							</button>
						</>
					)}
				</div>
			)}

			<EditCompanyDialog
				open={editing!==null}
				onOpenChange={next => {
					if ( !next ) setEditing( null )
				}}
				company={editing}
				onCompanyUpdated={fetchCompanies}
			/>
		</div>
	)
}
