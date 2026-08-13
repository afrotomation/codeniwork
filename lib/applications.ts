/**
 * Pipeline derivations.
 *
 * The console shows one dataset — the user's applications — projected several
 * ways: a stats strip, an action queue, a pipeline table, a month grid. Every
 * projection is derived here so the numbers agree across screens.
 */

export type ApplicationStatus=
	|'applied'
	|'screening'
	|'interview'
	|'offer'
	|'rejected'
	|'withdrawn'

export interface JobApplication {
	id: string
	position: string
	status: string
	priority: string|null
	salary: string|null
	location: string|null
	jobUrl: string|null
	notes: string|null
	appliedAt: Date|string
	deadline: Date|string|null
	isRemote: boolean|null
	company: {
		id: string
		name: string
		logo: string|null
		website: string|null
	}
}

export interface ApplicationEvent {
	id: string
	type: string
	title: string
	description: string|null
	date: Date|string
}

/** Stages still in play. Everything else is closed. */
export const OPEN_STAGES: ApplicationStatus[]=[ 'applied','screening','interview','offer' ]

export const STAGE_ORDER: ApplicationStatus[]=[
	'applied',
	'screening',
	'interview',
	'offer',
	'rejected',
	'withdrawn',
]

/** How long a silent application waits before it needs a nudge. */
const FOLLOW_UP_DAYS=14

/** A deadline this close is spoken of by weekday rather than by date. */
const NEAR_DAYS=7

const MS_PER_DAY=86_400_000

const MONTHS=[ 'jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec' ]
const WEEKDAYS=[ 'sun','mon','tue','wed','thu','fri','sat' ]

const NUMBER_WORDS=[
	'Zero','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten',
	'Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen',
	'Eighteen','Nineteen','Twenty',
]

export function toDate ( value: Date|string|null|undefined ): Date|null {
	if ( !value ) return null
	const date=typeof value==='string'? new Date( value ):value
	return isNaN( date.getTime() )? null:date
}

/** Midnight-anchored so "days until" counts calendar days, not elapsed hours. */
export function startOfDay ( date: Date ): Date {
	return new Date( date.getFullYear(),date.getMonth(),date.getDate() )
}

export function daysBetween ( from: Date,to: Date ): number {
	return Math.round( ( startOfDay( to ).getTime()-startOfDay( from ).getTime() )/MS_PER_DAY )
}

export function isSameDay ( a: Date,b: Date ): boolean {
	return a.getFullYear()===b.getFullYear()
		&&a.getMonth()===b.getMonth()
		&&a.getDate()===b.getDate()
}

/** "aug 04" — the console never shouts a date. */
export function formatShortDate ( value: Date|string|null|undefined ): string {
	const date=toDate( value )
	if ( !date ) return '—'
	return `${MONTHS[ date.getMonth() ]} ${String( date.getDate() ).padStart( 2,'0' )}`
}

export function formatWeekday ( date: Date ): string {
	return WEEKDAYS[ date.getDay() ]
}

/** "tomorrow", "2 days", "6 days ago" — used by the action queue's right column. */
export function formatRelativeDays ( days: number ): string {
	if ( days===0 ) return 'today'
	if ( days===1 ) return 'tomorrow'
	if ( days===-1 ) return 'yesterday'
	if ( days<0 ) return `${Math.abs( days )} days ago`
	return `${days} days`
}

export function numberWord ( n: number ): string {
	return n>=0&&n<NUMBER_WORDS.length? NUMBER_WORDS[ n ]:String( n )
}

export function isOpen ( app: JobApplication ): boolean {
	return OPEN_STAGES.includes( app.status as ApplicationStatus )
}

/* ── Next step ─────────────────────────────────────────────────
   The `next` column. Tone drives colour: accent for a live
   commitment, warn for something already late, dim for waiting. */

export type NextStepTone='accent'|'warn'|'dim'|'plain'

export interface NextStep {
	label: string
	tone: NextStepTone
	/** Days from today. Negative is overdue. Null when nothing is scheduled. */
	days: number|null
}

function deadlineVerb ( status: string ): string {
	if ( status==='offer' ) return 'expires'
	if ( status==='interview' ) return 'interview'
	return 'due'
}

export function getNextStep ( app: JobApplication,now: Date=new Date() ): NextStep {
	if ( !isOpen( app ) ) {
		return { label: 'archived',tone: 'dim',days: null }
	}

	const deadline=toDate( app.deadline )
	if ( deadline ) {
		const days=daysBetween( now,deadline )
		const verb=deadlineVerb( app.status )

		if ( days<0 ) return { label: 'overdue',tone: 'warn',days }
		if ( days<=NEAR_DAYS ) {
			return { label: `${verb} ${formatWeekday( deadline )}`,tone: 'accent',days }
		}
		return { label: `${verb} ${formatShortDate( deadline )}`,tone: 'plain',days }
	}

	// No deadline: an application that has gone quiet is the thing to surface.
	const applied=toDate( app.appliedAt )
	if ( applied&&( app.status==='applied'||app.status==='screening' ) ) {
		const waited=daysBetween( applied,now )
		if ( waited>=FOLLOW_UP_DAYS ) {
			return { label: `follow up ${waited-FOLLOW_UP_DAYS}d`,tone: 'warn',days: FOLLOW_UP_DAYS-waited }
		}
		const due=new Date( applied.getTime()+FOLLOW_UP_DAYS*MS_PER_DAY )
		return { label: `wait ${formatShortDate( due )}`,tone: 'dim',days: daysBetween( now,due ) }
	}

	return { label: 'schedule',tone: 'dim',days: null }
}

/* ── Action queue ──────────────────────────────────────────────
   What is actually waiting on the user, urgent first. */

export interface ActionItem {
	id: string
	/** Left column: a weekday for something scheduled, "late" for an overdue one. */
	when: string
	text: string
	relative: string
	tone: 'accent'|'warn'
	days: number
}

export function getActionQueue ( applications: JobApplication[],now: Date=new Date() ): ActionItem[] {
	const items: ActionItem[]=[]

	for ( const app of applications ) {
		if ( !isOpen( app ) ) continue

		const next=getNextStep( app,now )
		if ( next.days===null ) continue

		const company=app.company.name
		const deadline=toDate( app.deadline )

		if ( deadline ) {
			const days=next.days
			// Anything past due, or landing inside the week, wants a decision now.
			if ( days>NEAR_DAYS ) continue

			const overdue=days<0
			items.push( {
				id: app.id,
				when: overdue? 'late':formatWeekday( deadline ),
				text: app.status==='offer'
					? `${company} — accept or decline offer`
					:`${company} — ${app.position}`,
				relative: formatRelativeDays( days ),
				tone: overdue? 'warn':'accent',
				days,
			} )
			continue
		}

		// Gone quiet past the follow-up window.
		if ( next.tone==='warn' ) {
			items.push( {
				id: app.id,
				when: 'late',
				text: `${company} — follow-up email`,
				relative: formatRelativeDays( next.days ),
				tone: 'warn',
				days: next.days,
			} )
		}
	}

	return items.sort( ( a,b ) => a.days-b.days )
}

/* ── Stats strip ───────────────────────────────────────────── */

export interface PipelineStats {
	total: number
	open: number
	applied: number
	screening: number
	interview: number
	offer: number
	rejected: number
	withdrawn: number
	closed: number
	/** Share of applications that drew a human response. */
	replyRate: number
	/** Bar segments, as percentages of total. */
	advancedPct: number
	screeningPct: number
}

export function getPipelineStats ( applications: JobApplication[] ): PipelineStats {
	const by=( status: string ) => applications.filter( app => app.status===status ).length

	const total=applications.length
	const applied=by( 'applied' )
	const screening=by( 'screening' )
	const interview=by( 'interview' )
	const offer=by( 'offer' )
	const rejected=by( 'rejected' )
	const withdrawn=by( 'withdrawn' )

	const advanced=interview+offer
	// A reply is anything that moved past the initial send.
	const replied=screening+advanced
	const pct=( n: number ) => total>0? Math.round( ( n/total )*100 ):0

	return {
		total,
		open: applied+screening+advanced,
		applied,
		screening,
		interview,
		offer,
		rejected,
		withdrawn,
		closed: rejected+withdrawn,
		replyRate: pct( replied ),
		advancedPct: pct( advanced ),
		screeningPct: pct( screening ),
	}
}

/** "Twelve open, three waiting on you" */
export function getPipelineHeadline ( stats: PipelineStats,waiting: number ): string {
	if ( stats.total===0 ) return 'Nothing tracked yet'
	if ( waiting===0 ) return `${numberWord( stats.open )} open, nothing waiting on you`
	return `${numberWord( stats.open )} open, ${numberWord( waiting ).toLowerCase()} waiting on you`
}

/* ── Calendar ──────────────────────────────────────────────── */

export type CalendarEventKind='applied'|'deadline'|'overdue'

export interface CalendarEvent {
	id: string
	date: Date
	label: string
	kind: CalendarEventKind
	application: JobApplication
}

export function getCalendarEvents ( applications: JobApplication[],now: Date=new Date() ): CalendarEvent[] {
	const events: CalendarEvent[]=[]

	for ( const app of applications ) {
		const company=app.company.name.toLowerCase()

		const applied=toDate( app.appliedAt )
		if ( applied ) {
			events.push( {
				id: `${app.id}-applied`,
				date: applied,
				label: `applied ${company}`,
				kind: 'applied',
				application: app,
			} )
		}

		const deadline=toDate( app.deadline )
		if ( deadline&&isOpen( app ) ) {
			const overdue=daysBetween( now,deadline )<0
			events.push( {
				id: `${app.id}-deadline`,
				date: deadline,
				label: app.status==='offer'
					? `${company} offer expires`
					:`${company} ${app.status==='interview'? 'interview':'deadline'}`,
				kind: overdue? 'overdue':'deadline',
				application: app,
			} )
		}
	}

	return events.sort( ( a,b ) => a.date.getTime()-b.date.getTime() )
}

/**
 * The month grid, Monday-first, always six full weeks so the grid does not
 * change height as the user pages through months.
 */
export function getMonthGrid ( year: number,month: number ): Date[] {
	const first=new Date( year,month,1 )
	// getDay() is Sunday-first; shift so Monday is column 0.
	const offset=( first.getDay()+6 )%7
	const start=new Date( year,month,1-offset )

	return Array.from( { length: 42 },( _,i ) =>
		new Date( start.getFullYear(),start.getMonth(),start.getDate()+i )
	)
}
