'use client'

import { getPipelineStats,type JobApplication } from '@/lib/applications'

interface DashboardStatsProps {
	applications: JobApplication[]
	isLoading?: boolean
}

function Figure ( { value,label,accent }: { value: string; label: string; accent?: boolean } ) {
	return (
		<div>
			<div className={`text-[25px] leading-none ${accent? 'text-ac':'text-fg'}`}>{value}</div>
			<div className="label mt-1.5">{label}</div>
		</div>
	)
}

/**
 * The pipeline compressed to one strip: four counts and a bar showing how much
 * of the pipeline is still alive, and how far along it is.
 */
export function DashboardStats ( { applications,isLoading }: DashboardStatsProps ) {
	if ( isLoading ) {
		return (
			<div className="mt-[26px] flex gap-8 border border-br px-5 py-[18px]">
				{Array.from( { length: 4 } ).map( ( _,i ) => (
					<div key={i}>
						<div className="skeleton h-[25px] w-9" />
						<div className="skeleton mt-1.5 h-3 w-14" />
					</div>
				) )}
				<div className="ml-auto min-w-[220px]">
					<div className="skeleton h-2 w-full" />
					<div className="skeleton mt-2 h-3 w-40" />
				</div>
			</div>
		)
	}

	const stats=getPipelineStats( applications )
	const pad=( n: number ) => String( n ).padStart( 2,'0' )

	// Advanced → rest-of-open → closed. The three add up to the whole pipeline;
	// an empty pipeline leaves the whole track inert rather than filling it.
	const closedPct=stats.total>0? Math.round( ( stats.closed/stats.total )*100 ):0
	const openRestPct=stats.total>0
		? Math.max( 0,100-stats.advancedPct-closedPct )
		:0

	return (
		<div className="mt-[26px] flex gap-8 border border-br px-5 py-[18px]">
			<Figure value={String( stats.total )} label="total" />
			<Figure value={String( stats.open )} label="open" />
			<Figure value={pad( stats.interview )} label="interview" accent />
			<Figure value={pad( stats.offer )} label="offer" accent />

			<div className="ml-auto min-w-[220px]">
				<div className="flex h-2 bg-br">
					<div className="bg-ac" style={{ width: `${stats.advancedPct}%` }} />
					<div className="bg-ac opacity-50" style={{ width: `${openRestPct}%` }} />
				</div>
				<div className="mt-2 text-[10.5px] text-dim">
					{stats.replyRate}% reply rate · {stats.closed} closed
				</div>
			</div>
		</div>
	)
}
