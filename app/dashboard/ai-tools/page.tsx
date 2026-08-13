'use client'

import { DashboardHeader } from '@/components/dashboard/header'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useEffect,useState } from 'react'

interface ResumeParseResult {
	id: string
	name: string|null
	email: string|null
	phone: string|null
	summary: string|null
	skills: string[]|null
	experience: { title: string; company: string; duration: string; description: string }[]|null
	education: { degree: string; school: string; year: string }[]|null
	createdAt?: string
}

interface MatchResult {
	matchScore: number
	matchedSkills: string[]|null
	missingSkills: string[]|null
	aiAnalysis: string|null
}

interface CoverLetterResult {
	id: string
	content: string
	tone: string
}

interface InterviewQuestion {
	question: string
	category: string
	difficulty: string
	answerFramework: string
	tips: string
}

const TOOLS=[ 'parse resume','score match','cover letter','interview prep' ] as const
type ToolIndex=0|1|2|3

const fieldClass=
	'w-full border border-br bg-transparent p-3.5 font-mono text-[12.5px] leading-[1.8] text-fg placeholder:text-dim focus:border-ac focus:outline-none'

/** A panel header: the tool's number and name, with its status on the right. */
function PanelHead ( { index,label,status }: { index: number; label: string; status: React.ReactNode } ) {
	return (
		<div className="flex flex-wrap justify-between gap-3 border-b border-br px-5 py-4">
			<span className="text-[10.5px] uppercase tracking-[.12em] text-dim">
				{String( index+1 ).padStart( 2,'0' )} — {label}
			</span>
			<span className="text-[11.5px]">{status}</span>
		</div>
	)
}

function Field ( { label,value }: { label: string; value: React.ReactNode } ) {
	return (
		<div className="flex gap-3.5 text-[12.5px]">
			<span className="w-[74px] flex-none text-dim">{label}</span>
			<span className="flex-1 leading-[1.7]">{value}</span>
		</div>
	)
}

export default function AiToolsPage () {
	const [ tool,setTool ]=useState<ToolIndex>( 0 )

	const [ resumeText,setResumeText ]=useState( '' )
	const [ parsedResume,setParsedResume ]=useState<ResumeParseResult|null>( null )
	const [ parsing,setParsing ]=useState( false )

	const [ jobDesc,setJobDesc ]=useState( '' )
	const [ matchResult,setMatchResult ]=useState<MatchResult|null>( null )
	const [ scoring,setScoring ]=useState( false )

	const [ coverLetterJobDesc,setCoverLetterJobDesc ]=useState( '' )
	const [ companyName,setCompanyName ]=useState( '' )
	const [ position,setPosition ]=useState( '' )
	const [ tone,setTone ]=useState( 'professional' )
	const [ coverLetter,setCoverLetter ]=useState<CoverLetterResult|null>( null )
	const [ generating,setGenerating ]=useState( false )
	const [ copied,setCopied ]=useState( false )

	const [ interviewJobDesc,setInterviewJobDesc ]=useState( '' )
	const [ questions,setQuestions ]=useState<InterviewQuestion[]>( [] )
	const [ prepping,setPrepping ]=useState( false )
	const [ expandedQuestion,setExpandedQuestion ]=useState<number|null>( 0 )

	// The last parse carries over between sessions, so the other three tools are
	// usable straight away.
	useEffect( () => {
		fetch( '/api/ai/parse-resume' )
			.then( response => ( response.ok? response.json():null ) )
			.then( parse => {
				if ( parse ) setParsedResume( parse )
			} )
			.catch( () => undefined )
	},[] )

	async function handleParseResume () {
		if ( !resumeText.trim() ) return
		setParsing( true )
		try {
			const res=await fetch( '/api/ai/parse-resume',{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify( { text: resumeText } ),
			} )
			if ( !res.ok ) throw new Error( 'Failed to parse' )
			setParsedResume( await res.json() )
		} catch {
			alert( 'Failed to parse resume. Please try again.' )
		} finally {
			setParsing( false )
		}
	}

	async function handleScoreMatch () {
		if ( !jobDesc.trim()||!parsedResume ) return
		setScoring( true )
		try {
			const res=await fetch( '/api/ai/score-match',{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify( { resumeParseId: parsedResume.id,jobDescription: jobDesc } ),
			} )
			if ( !res.ok ) throw new Error( 'Failed to score' )
			setMatchResult( await res.json() )
		} catch {
			alert( 'Failed to score match. Please try again.' )
		} finally {
			setScoring( false )
		}
	}

	async function handleGenerateCoverLetter () {
		if ( !coverLetterJobDesc.trim()||!companyName.trim()||!position.trim()||!parsedResume ) return
		setGenerating( true )
		try {
			const res=await fetch( '/api/ai/cover-letter',{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify( {
					resumeParseId: parsedResume.id,
					jobDescription: coverLetterJobDesc,
					companyName,
					position,
					tone,
				} ),
			} )
			if ( !res.ok ) throw new Error( 'Failed to generate' )
			setCoverLetter( await res.json() )
		} catch {
			alert( 'Failed to generate cover letter. Please try again.' )
		} finally {
			setGenerating( false )
		}
	}

	async function handleInterviewPrep () {
		if ( !interviewJobDesc.trim() ) return
		setPrepping( true )
		try {
			const res=await fetch( '/api/ai/interview-prep',{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify( {
					jobDescription: interviewJobDesc,
					resumeParseId: parsedResume?.id,
				} ),
			} )
			if ( !res.ok ) throw new Error( 'Failed to prep' )
			const data=await res.json()
			setQuestions( data.questions||[] )
			setExpandedQuestion( 0 )
		} catch {
			alert( 'Failed to generate interview prep. Please try again.' )
		} finally {
			setPrepping( false )
		}
	}

	useEffect( () => {
		const onKeyDown=( event: KeyboardEvent ) => {
			if ( !( event.metaKey||event.ctrlKey )||event.key!=='Enter' ) return

			event.preventDefault()
			const run=[ handleParseResume,handleScoreMatch,handleGenerateCoverLetter,handleInterviewPrep ][ tool ]
			run()
		}

		window.addEventListener( 'keydown',onKeyDown )
		return () => window.removeEventListener( 'keydown',onKeyDown )
		// Each handler reads current state directly, so only the active tool matters here.
	} )

	function handleCopy ( text: string ) {
		navigator.clipboard.writeText( text )
		setCopied( true )
		setTimeout( () => setCopied( false ),2000 )
	}

	return (
		<div>
			<DashboardHeader eyebrow="ai tools" title="Resume parsing, matching, prep" />

			<div className="mt-[22px] flex flex-wrap gap-2">
				{TOOLS.map( ( label,index ) => (
					<button
						key={label}
						type="button"
						onClick={() => setTool( index as ToolIndex )}
						className={cn(
							'border px-[13px] py-2 text-[11.5px] transition-colors',
							tool===index? 'border-ac text-ac':'border-br text-dim hover:border-ac hover:text-ac'
						)}
					>
						{String( index+1 ).padStart( 2,'0' )} {label}
					</button>
				) )}
			</div>

			{tool===0&&(
				<div className="mt-[22px] border border-br">
					<PanelHead
						index={0}
						label="parse resume"
						status={
							parsedResume
								? <span className="text-ac">parsed</span>
								:<span className="text-dim">paste your resume to begin</span>
						}
					/>
					<div className="grid grid-cols-1 gap-6 p-5 lg:grid-cols-2">
						<div>
							<textarea
								value={resumeText}
								onChange={event => setResumeText( event.target.value )}
								placeholder="Paste your resume text here…"
								rows={6}
								className={cn( fieldClass,'min-h-[104px] resize-y' )}
							/>
							<Button className="mt-3" onClick={handleParseResume} disabled={parsing||!resumeText.trim()}>
								{parsing? 'parsing…':'parse resume'}
							</Button>
						</div>

						<div className="flex flex-col gap-3">
							{parsedResume? (
								<>
									<Field label="name" value={parsedResume.name??'—'} />
									<Field label="email" value={parsedResume.email??'—'} />
									<Field
										label="skills"
										value={parsedResume.skills?.length? parsedResume.skills.join( ' · ' ):'—'}
									/>
									<Field
										label="experience"
										value={
											parsedResume.experience?.length
												? `${parsedResume.experience.length} role${
													parsedResume.experience.length===1? '':'s'
												} · last: ${parsedResume.experience[ 0 ].title}, ${parsedResume.experience[ 0 ].company}`
												:'—'
										}
									/>
								</>
							):(
								<div className="text-[12.5px] leading-[1.8] text-dim">
									Nothing parsed yet. The result feeds the other three tools.
								</div>
							)}
						</div>
					</div>
				</div>
			)}

			{tool===1&&(
				<div className="mt-[22px] border border-br">
					<PanelHead
						index={1}
						label="score match"
						status={
							parsedResume
								? <span className="text-dim">against the pasted job description</span>
								:<span className="text-wn">parse a resume first</span>
						}
					/>
					<div className="grid grid-cols-1 gap-6 p-5 lg:grid-cols-[180px_minmax(0,1fr)] lg:items-start">
						<div>
							<div className="text-[44px] leading-none text-ac">
								{matchResult? matchResult.matchScore:'—'}
							</div>
							<div className="label mt-2">of 100</div>
							<div className="mt-3.5 flex h-[7px] bg-ft">
								<div className="bg-ac" style={{ width: `${matchResult?.matchScore??0}%` }} />
							</div>
						</div>

						<div>
							<textarea
								value={jobDesc}
								onChange={event => setJobDesc( event.target.value )}
								placeholder="Paste the job description…"
								rows={4}
								className={cn( fieldClass,'resize-y' )}
							/>
							<Button
								className="mt-3"
								onClick={handleScoreMatch}
								disabled={scoring||!parsedResume||!jobDesc.trim()}
							>
								{scoring? 'scoring…':'score match'}
							</Button>

							{matchResult&&(
								<div className="mt-4">
									{matchResult.matchedSkills?.length? (
										<>
											<div className="label">matched</div>
											<div className="mt-2.5 text-[12.5px] leading-[1.8]">
												{matchResult.matchedSkills.join( ' · ' )}
											</div>
										</>
									):null}
									{matchResult.missingSkills?.length? (
										<>
											<div className="label mt-4">missing</div>
											<div className="mt-2.5 text-[12.5px] leading-[1.8] text-wn">
												{matchResult.missingSkills.join( ' · ' )}
											</div>
										</>
									):null}
									{matchResult.aiAnalysis&&(
										<div className="mt-4 text-[12.5px] leading-[1.8] text-dim">
											{matchResult.aiAnalysis}
										</div>
									)}
								</div>
							)}
						</div>
					</div>
				</div>
			)}

			{tool===2&&(
				<div className="mt-[22px] border border-br">
					<PanelHead
						index={2}
						label="cover letter"
						status={
							coverLetter
								? <span className="text-ac">{coverLetter.tone}</span>
								:<span className="text-dim">{parsedResume? 'ready':'parse a resume first'}</span>
						}
					/>
					<div className="grid grid-cols-1 gap-6 p-5 lg:grid-cols-2">
						<div className="flex flex-col gap-3">
							<input
								value={companyName}
								onChange={event => setCompanyName( event.target.value )}
								placeholder="Company"
								className={fieldClass}
							/>
							<input
								value={position}
								onChange={event => setPosition( event.target.value )}
								placeholder="Position"
								className={fieldClass}
							/>
							<div className="flex gap-2">
								{[ 'professional','casual','enthusiastic' ].map( option => (
									<button
										key={option}
										type="button"
										onClick={() => setTone( option )}
										className={cn(
											'border px-3 py-[7px] text-[11.5px] transition-colors',
											tone===option
												? 'border-ac text-ac'
												:'border-br text-dim hover:border-ac hover:text-ac'
										)}
									>
										{option}
									</button>
								) )}
							</div>
							<textarea
								value={coverLetterJobDesc}
								onChange={event => setCoverLetterJobDesc( event.target.value )}
								placeholder="Paste the job description…"
								rows={5}
								className={cn( fieldClass,'resize-y' )}
							/>
							<Button
								onClick={handleGenerateCoverLetter}
								disabled={
									generating||!parsedResume||!coverLetterJobDesc.trim()||!companyName.trim()||!position.trim()
								}
							>
								{generating? 'writing…':'generate cover letter'}
							</Button>
						</div>

						<div>
							{coverLetter? (
								<>
									<div className="max-h-[420px] overflow-auto border border-br p-3.5 text-[12.5px] leading-[1.85] whitespace-pre-wrap">
										{coverLetter.content}
									</div>
									<Button
										variant="outline"
										className="mt-3"
										onClick={() => handleCopy( coverLetter.content )}
									>
										{copied? 'copied':'copy'}
									</Button>
								</>
							):(
								<div className="text-[12.5px] leading-[1.8] text-dim">
									The draft appears here. It is saved against your account, not sent anywhere.
								</div>
							)}
						</div>
					</div>
				</div>
			)}

			{tool===3&&(
				<div className="mt-[22px] border border-br">
					<PanelHead
						index={3}
						label="interview prep"
						status={
							questions.length>0
								? <span className="text-dim">{questions.length} questions generated</span>
								:<span className="text-dim">paste a job description</span>
						}
					/>
					<div className="p-5">
						<textarea
							value={interviewJobDesc}
							onChange={event => setInterviewJobDesc( event.target.value )}
							placeholder="Paste the job description…"
							rows={3}
							className={cn( fieldClass,'resize-y' )}
						/>
						<Button className="mt-3" onClick={handleInterviewPrep} disabled={prepping||!interviewJobDesc.trim()}>
							{prepping? 'thinking…':'generate questions'}
						</Button>
					</div>

					{questions.length>0&&(
						<div className="px-5 pb-5">
							{questions.map( ( question,index ) => {
								const isOpen=expandedQuestion===index
								return (
									<div key={question.question} className={index<questions.length-1? 'row-rule':undefined}>
										<button
											type="button"
											onClick={() => setExpandedQuestion( isOpen? null:index )}
											className="flex w-full items-baseline gap-3.5 py-3.5 text-left"
										>
											<span className={cn( 'flex-none text-[12px]',isOpen? 'text-ac':'text-dim' )}>
												Q{index+1}
											</span>
											<span className="display flex-1 text-[14px]">{question.question}</span>
											<span className="flex-none text-[11.5px] text-dim">
												{question.category} · {question.difficulty}
											</span>
										</button>
										{isOpen&&( question.answerFramework||question.tips )&&(
											<div className="mb-3.5 ml-[34px] text-[12.5px] leading-[1.8] text-dim">
												{question.answerFramework}
												{question.tips&&<span> {question.tips}</span>}
											</div>
										)}
									</div>
								)
							} )}
						</div>
					)}
				</div>
			)}
		</div>
	)
}
