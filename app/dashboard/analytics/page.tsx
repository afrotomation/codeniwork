'use client'

import { DashboardHeader } from '@/components/dashboard/header'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useCallback,useEffect,useState } from 'react'

interface MonthProgress {
	label: string
	year: number
	applied: number
	interviews: number
	offers: number
}

interface Analytics {
	total: number
	responseRate: number
	interviewRate: number
	offerRate: number
	avgDaysToReply: number|null
	deltas: { responseRate: number; interviewRate: number; offerRate: number }
	months: MonthProgress[]
	funnel: { stage: string; count: number; share: number }[]
	topCompanies: { name: string; applications: number; replyRate: number }[]
}

function Delta ( { points,unit='pts' }: { points: number; unit?: string } ) {
	if ( points===0 ) return <span className="text-dim">level with last month</span>
	const better=points>0
	return (
		<span className={better? 'text-ac':'text-wn'}>
			{better? '+':''}{points} {unit} from last month
		</span>
	)
}

function StatCell ( {
	label,
	value,
	footnote,
}: {
	label: string
	value: string
	footnote: React.ReactNode
} ) {
	return (
		<div className="border-r border-b border-br p-5">
			<div className="label">{label}</div>
			<div className="mt-3.5 text-[30px] leading-none">{value}</div>
			<div className="mt-[9px] text-[11.5px]">{footnote}</div>
		</div>
	)
}

export default function AnalyticsPage () {
	const [ data,setData ]=useState<Analytics|null>( null )
	const [ isLoading,setIsLoading ]=useState( true )
	const [ error,setError ]=useState<string|null>( null )

	const load=useCallback( async () => {
		setIsLoading( true )
		try {
			const response=await fetch( '/api/dashboard/analytics' )
			if ( !response.ok ) throw new Error( 'Failed to fetch analytics' )
			setData( await response.json() )
			setError( null )
		} catch ( err ) {
			console.error( 'Error fetching analytics:',err )
			setError( 'could not load analytics' )
		} finally {
			setIsLoading( false )
		}
	},[] )

	useEffect( () => {
		load()
	},[ load ] )

	useEffect( () => {
		const onKeyDown=( event: KeyboardEvent ) => {
			if ( event.metaKey||event.ctrlKey||event.altKey ) return
			if ( event.key!=='r'&&event.key!=='R' ) return

			const target=event.target as HTMLElement|null
			if ( target?.isContentEditable ) return
			if ( target&&/^(INPUT|TEXTAREA|SELECT)$/.test( target.tagName ) ) return

			event.preventDefault()
			load()
		}

		window.addEventListener( 'keydown',onKeyDown )
		return () => window.removeEventListener( 'keydown',onKeyDown )
	},[ load ] )

	// Bars are scaled against the busiest month so the shape stays readable.
	const peak=data? Math.max( 1,...data.months.map( month => month.applied ) ):1
	const span=data
		? `${data.months.length} months of searching`
		:'Analytics'

	return (
		<div>
			<DashboardHeader
				eyebrow="analytics"
				title={isLoading&&!data? 'Loading analytics':span}
				align="end"
				action={
					<Button variant="ghost" className="border border-br" onClick={load} shortcut="R">
						refresh
					</Button>
				}
			/>

			{error&&(
				<div className="panel-warn mt-5 px-5 py-4 text-[12.5px] text-wn">{error}</div>
			)}

			{!isLoading&&!data&&(
				<div className="mt-7 border border-br py-10 text-center text-[12.5px] text-dim">
					Nothing to chart yet.
				</div>
			)}

			{( isLoading||data )&&(
			<div className="mt-7 grid grid-cols-1 border-t border-l border-br sm:grid-cols-2 xl:grid-cols-4">
				{isLoading&&!data? (
					Array.from( { length: 4 } ).map( ( _,i ) => (
						<div key={i} className="border-r border-b border-br p-5">
							<div className="skeleton h-3 w-24" />
							<div className="skeleton mt-3.5 h-[30px] w-16" />
							<div className="skeleton mt-[9px] h-3 w-32" />
						</div>
					) )
				):data? (
					<>
						<StatCell
							label="response rate"
							value={`${data.responseRate}%`}
							footnote={<Delta points={data.deltas.responseRate} />}
						/>
						<StatCell
							label="interview rate"
							value={`${data.interviewRate}%`}
							footnote={<Delta points={data.deltas.interviewRate} />}
						/>
						<StatCell
							label="offer rate"
							value={`${data.offerRate}%`}
							footnote={<Delta points={data.deltas.offerRate} />}
						/>
						<StatCell
							label="avg days to reply"
							value={data.avgDaysToReply===null? '—':String( data.avgDaysToReply )}
							footnote={
								<span className="text-dim">
									{data.avgDaysToReply===null
										? 'no replies logged yet'
										:'across every logged reply'}
								</span>
							}
						/>
					</>
				):null}
			</div>
			)}

			{( isLoading||data )&&(
			<div className="mt-[26px] grid grid-cols-1 gap-[26px] xl:grid-cols-[minmax(0,1fr)_380px]">
				<div className="border border-br p-5">
					<div className="text-[10.5px] uppercase tracking-[.12em] text-dim">monthly progress</div>

					<div className="mt-5 flex flex-col gap-4">
						{isLoading&&!data? (
							Array.from( { length: 6 } ).map( ( _,i ) => (
								<div key={i}>
									<div className="skeleton h-3 w-full" />
									<div className="skeleton mt-2 h-[7px] w-full" />
								</div>
							) )
						):(
							data?.months.map( month => (
								<div key={`${month.label}-${month.year}`}>
									<div className="flex justify-between gap-3 text-[12px]">
										<span>{month.label}</span>
										<span className="text-dim">
											{month.applied} applied · {month.interviews}{' '}
											{month.interviews===1? 'interview':'interviews'} · {month.offers}{' '}
											{month.offers===1? 'offer':'offers'}
										</span>
									</div>
									<div className="mt-2 flex h-[7px] gap-[2px]">
										<div className="bg-ac" style={{ width: `${( month.applied/peak )*70}%` }} />
										<div
											className="bg-ac opacity-50"
											style={{ width: `${( month.interviews/peak )*70}%` }}
										/>
										<div className="bg-fg" style={{ width: `${( month.offers/peak )*70}%` }} />
										<div className="flex-1 bg-ft" />
									</div>
								</div>
							) )
						)}
					</div>

					<div className="mt-[22px] flex flex-wrap gap-[18px] text-[11px] text-dim">
						<span className="flex items-center gap-1.5">
							<span className="inline-block h-[7px] w-[9px] bg-ac" />applied
						</span>
						<span className="flex items-center gap-1.5">
							<span className="inline-block h-[7px] w-[9px] bg-ac opacity-50" />interviews
						</span>
						<span className="flex items-center gap-1.5">
							<span className="inline-block h-[7px] w-[9px] bg-fg" />offers
						</span>
					</div>
				</div>

				<div className="border border-br p-5">
					{/* The design shows replies by source. Applications carry no source
					    field, so this is the stage funnel — the same question the panel
					    answers, asked of data that exists. */}
					<div className="text-[10.5px] uppercase tracking-[.12em] text-dim">where things stand</div>
					<div className="mt-[18px] flex flex-col">
						{data?.funnel
							.filter( entry => entry.count>0 )
							.map( ( entry,index,visible ) => (
								<div
									key={entry.stage}
									className={cn(
										'flex justify-between py-[13px]',
										index<visible.length-1&&'border-b border-ft'
									)}
								>
									<span>{entry.stage}</span>
									<span className={entry.stage==='offer'? 'text-ac':'text-fg'}>
										{entry.count} · {entry.share}%
									</span>
								</div>
							) )}
						{data&&data.total===0&&(
							<div className="py-[13px] text-[12px] text-dim">Nothing tracked yet.</div>
						)}
					</div>

					<div className="mt-[22px] border-t border-br pt-5 text-[10.5px] uppercase tracking-[.12em] text-dim">
						most applied to
					</div>
					<div className="mt-3.5 flex flex-col gap-[11px] text-[12.5px]">
						{data?.topCompanies.map( company => (
							<div key={company.name} className="flex justify-between gap-3">
								<span className="truncate">{company.name}</span>
								<span className="flex-none text-dim">
									{company.applications} app{company.applications===1? '':'s'} · {company.replyRate}%
								</span>
							</div>
						) )}
						{data&&data.topCompanies.length===0&&(
							<span className="text-dim">No companies yet.</span>
						)}
					</div>
				</div>
			</div>
			)}
		</div>
	)
}
