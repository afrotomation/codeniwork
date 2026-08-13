'use client'

import { DashboardHeader } from '@/components/dashboard/header'
import { Button } from '@/components/ui/button'
import { formatAge,formatSalary,parseTags,scoreJob,type JobMatch } from '@/lib/job-match'
import { cn } from '@/lib/utils'
import { useCallback,useEffect,useMemo,useRef,useState } from 'react'

interface ExternalJob {
	id: string
	title: string
	company: string
	companyLogo: string|null
	url: string
	source: string
	description: string|null
	salaryMin: number|null
	salaryMax: number|null
	salaryCurrency: string|null
	location: string|null
	isRemote: boolean|null
	tags: string|null
	postedAt: string|null
	fetchedAt: string
	isSaved: boolean
}

const SOURCES=[ 'remoteok','adzuna','jsearch' ]

/** A score at or above this is worth the accent. */
const STRONG_MATCH=80

interface ParsedQuery {
	source: string|null
	remoteOnly: boolean
	minMatch: number|null
	text: string
}

/**
 * `remote:true`, `source:remoteok` and `match:>70` narrow; anything else is
 * free text handed to the jobs endpoint.
 */
function parseQuery ( raw: string ): ParsedQuery {
	const parsed: ParsedQuery={ source: null,remoteOnly: false,minMatch: null,text: '' }
	const words: string[]=[]

	for ( const token of raw.trim().split( /\s+/ ).filter( Boolean ) ) {
		const [ key,...rest ]=token.split( ':' )
		const value=rest.join( ':' )

		if ( key==='source'&&value ) parsed.source=value.toLowerCase()
		else if ( key==='remote' ) parsed.remoteOnly=value!=='false'
		else if ( key==='match'&&value ) {
			const number=parseInt( value.replace( /[^\d]/g,'' ),10 )
			if ( !isNaN( number ) ) parsed.minMatch=number
		} else words.push( token )
	}

	parsed.text=words.join( ' ' )
	return parsed
}

export default function DiscoverPage () {
	const [ jobs,setJobs ]=useState<ExternalJob[]>( [] )
	const [ skills,setSkills ]=useState<string[]|null>( null )
	const [ isLoading,setIsLoading ]=useState( true )
	const [ isFetching,setIsFetching ]=useState( false )
	const [ query,setQuery ]=useState( '' )
	const [ page,setPage ]=useState( 1 )
	const [ totalPages,setTotalPages ]=useState( 1 )
	const [ total,setTotal ]=useState( 0 )
	const [ selectedId,setSelectedId ]=useState<string|null>( null )
	const [ notice,setNotice ]=useState<string|null>( null )
	const inputRef=useRef<HTMLInputElement>( null )

	const parsed=useMemo( () => parseQuery( query ),[ query ] )

	// The user's own skills are what jobs are scored against.
	useEffect( () => {
		fetch( '/api/ai/parse-resume' )
			.then( response => ( response.ok? response.json():null ) )
			.then( parse => setSkills( parse?.skills??null ) )
			.catch( () => setSkills( null ) )
	},[] )

	const loadJobs=useCallback( async () => {
		setIsLoading( true )
		try {
			const params=new URLSearchParams()
			if ( parsed.text ) params.set( 'search',parsed.text )
			if ( parsed.source ) params.set( 'source',parsed.source )
			if ( parsed.remoteOnly ) params.set( 'remote','true' )
			params.set( 'page',String( page ) )

			const response=await fetch( `/api/jobs?${params}` )
			if ( !response.ok ) throw new Error( 'Failed to load jobs' )

			const data=await response.json()
			setJobs( data.jobs )
			setTotalPages( data.totalPages )
			setTotal( data.total )
		} catch ( error ) {
			console.error( 'Failed to load jobs:',error )
		} finally {
			setIsLoading( false )
		}
	},[ parsed.text,parsed.source,parsed.remoteOnly,page ] )

	useEffect( () => {
		loadJobs()
	},[ loadJobs ] )

	// Scored here so the list, the score and the detail panel never disagree.
	const scored=useMemo( () => {
		const rows=jobs.map( job => ( { job,match: scoreJob( parseTags( job.tags ),skills ) } ) )
		if ( parsed.minMatch===null ) return rows
		return rows.filter( row => ( row.match.score??0 )>=parsed.minMatch! )
	},[ jobs,skills,parsed.minMatch ] )

	const selected=scored.find( row => row.job.id===selectedId )??scored[ 0 ]??null

	const handleFetchNew=async () => {
		setIsFetching( true )
		setNotice( null )
		try {
			const response=await fetch( '/api/jobs/fetch',{ method: 'POST' } )
			if ( !response.ok ) throw new Error( 'Fetch failed' )

			const data=await response.json()
			const breakdown=Object.entries( data.sources??{} )
				.filter( ( [ ,count ] ) => ( count as number )>0 )
				.map( ( [ source,count ] ) => `${source} ${count}` )
				.join( ' · ' )
			setNotice( `${data.inserted} new · ${breakdown||'no new listings'}` )
			await loadJobs()
		} catch {
			setNotice( 'could not reach the job boards' )
		} finally {
			setIsFetching( false )
		}
	}

	const handleSave=async ( jobId: string,currentlySaved: boolean ) => {
		const response=await fetch( '/api/jobs/save',{
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify( { jobId,action: currentlySaved? 'unsave':'save' } ),
		} )
		if ( !response.ok ) return

		setJobs( previous =>
			previous.map( job => ( job.id===jobId? { ...job,isSaved: !currentlySaved }:job ) )
		)
	}

	const handleQuickApply=async ( jobId: string ) => {
		if ( !confirm( 'Add this job to your applications tracker?' ) ) return

		const response=await fetch( '/api/jobs/save',{
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify( { jobId } ),
		} )
		setNotice( response.ok? 'added to your applications':'could not add the application' )
	}

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
			} else if ( ( event.key==='s'||event.key==='S' )&&selected ) {
				event.preventDefault()
				handleSave( selected.job.id,selected.job.isSaved )
			}
		}

		window.addEventListener( 'keydown',onKeyDown )
		return () => window.removeEventListener( 'keydown',onKeyDown )
	},[ selected ] )

	const sourceCounts=useMemo( () => {
		const counts: Record<string,number>={}
		for ( const { job } of scored ) counts[ job.source ]=( counts[ job.source ]??0 )+1
		return counts
	},[ scored ] )

	return (
		<div>
			<DashboardHeader
				eyebrow="discover"
				title={
					isLoading&&jobs.length===0
						? 'Loading jobs'
						:`${total.toLocaleString()} job${total===1? '':'s'} from ${SOURCES.length} boards`
				}
				align="end"
				action={
					<Button variant="outline" onClick={handleFetchNew} disabled={isFetching}>
						{isFetching? 'fetching…':'fetch new jobs'}
					</Button>
				}
			/>

			{notice&&(
				<div className="panel-accent mt-5 px-5 py-3 text-[12px] text-ac">{notice}</div>
			)}

			<div className="mt-6 flex items-center border border-br">
				<span className="border-r border-br px-3.5 py-[13px] text-ac">/</span>
				<input
					ref={inputRef}
					value={query}
					onChange={event => {
						setQuery( event.target.value )
						setPage( 1 )
					}}
					placeholder="frontend engineer remote:true match:>70"
					spellCheck={false}
					aria-label="Filter jobs"
					className="flex-1 bg-transparent px-3.5 py-[13px] font-mono text-[13px] text-fg placeholder:text-dim focus:outline-none"
				/>
				<span className="border-l border-br px-3.5 py-[13px] text-[11.5px] text-dim">
					{scored.length} result{scored.length===1? '':'s'}
				</span>
			</div>

			<div className="mt-3.5 flex flex-wrap gap-2">
				<button
					type="button"
					onClick={() => setQuery( parsed.remoteOnly? 'remote:true':'' )}
					className={cn(
						'border px-3 py-[7px] text-[11.5px] transition-colors',
						parsed.source===null? 'border-ac text-ac':'border-br text-dim hover:border-ac hover:text-ac'
					)}
				>
					all sources
				</button>
				{SOURCES.map( source => (
					<button
						key={source}
						type="button"
						onClick={() => setQuery( `source:${source}` )}
						className={cn(
							'border px-3 py-[7px] text-[11.5px] transition-colors',
							parsed.source===source
								? 'border-ac text-ac'
								:'border-br text-dim hover:border-ac hover:text-ac'
						)}
					>
						{source} {sourceCounts[ source ]??0}
					</button>
				) )}
				<button
					type="button"
					onClick={() => setQuery( parsed.remoteOnly? '':'remote:true' )}
					className={cn(
						'border px-3 py-[7px] text-[11.5px] transition-colors',
						parsed.remoteOnly? 'border-ac text-ac':'border-br text-dim hover:border-ac hover:text-ac'
					)}
				>
					remote only
				</button>
			</div>

			{skills===null&&(
				<div className="mt-3.5 text-[11.5px] text-dim">
					Match scores need a parsed resume — run{' '}
					<a href="/dashboard/ai-tools" className="text-ac no-underline hover:underline">
						parse resume
					</a>{' '}
					once and every listing here gets scored against your skills.
				</div>
			)}

			<div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
				<div>
					<div className="flex flex-col border-t border-br">
						{isLoading? (
							Array.from( { length: 6 } ).map( ( _,i ) => (
								<div key={i} className="border-b border-br px-3.5 py-[15px]">
									<div className="skeleton h-4 w-2/3" />
									<div className="skeleton mt-[7px] h-3 w-1/2" />
								</div>
							) )
						):scored.length===0? (
							<div className="border-b border-br py-10 text-center text-[12.5px] text-dim">
								{total===0
									? 'No jobs stored yet. Fetch new jobs to fill the board.'
									:'Nothing matches that filter.'}
							</div>
						):(
							scored.map( ( { job,match } ) => {
								const isSelected=selected?.job.id===job.id
								const salary=formatSalary( job.salaryMin,job.salaryMax,job.salaryCurrency )

								return (
									<button
										key={job.id}
										type="button"
										onClick={() => setSelectedId( job.id )}
										className={cn(
											'border-b border-br px-3.5 py-[15px] text-left transition-colors',
											isSelected
												? 'bg-ft shadow-[inset_2px_0_0_var(--ac)]'
												:'hover:bg-ft'
										)}
									>
										<div className="flex justify-between gap-3">
											<span className="display truncate text-[14.5px] text-fg">{job.title}</span>
											{match.score!==null&&(
												<span
													className={cn(
														'flex-none text-[12px]',
														match.score>=STRONG_MATCH? 'text-ac':'text-dim'
													)}
												>
													{match.score} match
												</span>
											)}
											{job.isSaved&&<span className="flex-none text-[12px] text-ac">saved</span>}
										</div>
										<div className="mt-[7px] truncate text-[12px] text-dim">
											{[
												job.company,
												job.isRemote? 'remote':job.location,
												salary,
												job.source,
												formatAge( job.postedAt??job.fetchedAt ),
											]
												.filter( Boolean )
												.join( ' · ' )}
										</div>
									</button>
								)
							} )
						)}
					</div>

					{totalPages>1&&(
						<div className="mt-4 flex justify-between text-[12px] text-dim">
							<span>page {page} of {totalPages}</span>
							<span className="flex gap-4">
								{page>1&&(
									<button type="button" onClick={() => setPage( p => p-1 )} className="text-ac hover:underline">
										← prev
									</button>
								)}
								{page<totalPages&&(
									<button type="button" onClick={() => setPage( p => p+1 )} className="text-ac hover:underline">
										next →
									</button>
								)}
							</span>
						</div>
					)}
				</div>

				{selected&&<JobDetail job={selected.job} match={selected.match} onSave={handleSave} onApply={handleQuickApply} />}
			</div>
		</div>
	)
}

interface JobDetailProps {
	job: ExternalJob
	match: JobMatch
	onSave: ( jobId: string,currentlySaved: boolean ) => void
	onApply: ( jobId: string ) => void
}

function JobDetail ( { job,match,onSave,onApply }: JobDetailProps ) {
	const salary=formatSalary( job.salaryMin,job.salaryMax,job.salaryCurrency )
	const currency=job.salaryCurrency?.toLowerCase()??'usd'

	return (
		<div className="h-max border border-br">
			<div className="border-b border-br p-[18px]">
				<h2 className="display text-[17px] font-normal leading-[1.3]">{job.title}</h2>
				<div className="mt-2 text-[12.5px] text-dim">{job.company}</div>
				<div className="mt-3.5 flex flex-wrap gap-[7px]">
					{match.score!==null&&(
						<span className="border border-ac px-[9px] py-[5px] text-[11px] text-ac">
							{match.score} match
						</span>
					)}
					<span className="border border-br px-[9px] py-[5px] text-[11px] text-dim">{job.source}</span>
					{( job.isRemote||job.location )&&(
						<span className="border border-br px-[9px] py-[5px] text-[11px] text-dim">
							{job.isRemote? 'remote':job.location}
						</span>
					)}
					{salary&&(
						<span className="border border-br px-[9px] py-[5px] text-[11px] text-dim">
							{currency} {salary}
						</span>
					)}
				</div>
			</div>

			{( match.matched.length>0||match.missing.length>0 )&&(
				<div className="border-b border-br p-[18px]">
					{match.matched.length>0&&(
						<>
							<div className="label">matched skills</div>
							<div className="mt-2.5 text-[12px] leading-[1.9] text-fg">
								{match.matched.join( ' · ' )}
							</div>
						</>
					)}
					{match.missing.length>0&&(
						<>
							<div className={cn( 'label',match.matched.length>0&&'mt-4' )}>missing</div>
							<div className="mt-2.5 text-[12px] leading-[1.9] text-wn">
								{match.missing.join( ' · ' )}
							</div>
						</>
					)}
				</div>
			)}

			{job.description&&(
				<div className="border-b border-br p-[18px] text-[12px] leading-[1.85] text-dim">
					{job.description.length>420? `${job.description.slice( 0,420 )}…`:job.description}
				</div>
			)}

			<div className="flex gap-2.5 p-[18px]">
				<Button className="flex-1" onClick={() => onApply( job.id )}>quick apply</Button>
				<Button variant="outline" onClick={() => onSave( job.id,job.isSaved )}>
					{job.isSaved? 'saved':'save'}
				</Button>
				<Button variant="ghost" className="border border-br" asChild>
					<a href={job.url} target="_blank" rel="noopener noreferrer" aria-label="Open the original posting">
						↗
					</a>
				</Button>
			</div>
		</div>
	)
}
