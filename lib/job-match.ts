/**
 * Match scoring for discovered jobs.
 *
 * A job's tags are what it asks for; a resume parse's skills are what the user
 * has. The score is the share of the ask that is covered — computed here, in
 * the open, rather than by a model, so the matched/missing lists always explain
 * the number beside them.
 */

export interface JobMatch {
	/** 0–100, or null when the job listed no tags to score against. */
	score: number|null
	matched: string[]
	missing: string[]
}

const EMPTY: JobMatch={ score: null,matched: [],missing: [] }

function normalise ( value: string ): string {
	return value.toLowerCase().replace( /[^a-z0-9+#.]/g,'' )
}

/** Tags arrive as a JSON array in a text column. */
export function parseTags ( tags: string|null ): string[] {
	if ( !tags ) return []
	try {
		const parsed=JSON.parse( tags )
		return Array.isArray( parsed )? parsed.filter( ( t ): t is string => typeof t==='string' ):[]
	} catch {
		return []
	}
}

export function scoreJob ( tags: string[],skills: string[]|null|undefined ): JobMatch {
	if ( tags.length===0 ) return EMPTY
	if ( !skills||skills.length===0 ) return { score: null,matched: [],missing: tags }

	const owned=skills.map( normalise ).filter( Boolean )

	const matched: string[]=[]
	const missing: string[]=[]

	for ( const tag of tags ) {
		const needle=normalise( tag )
		if ( !needle ) continue

		// Either side may be the longer phrase — "react" covers "react.js", and
		// a "design systems" skill covers a "design system" tag.
		const hit=owned.some( skill => skill===needle||skill.includes( needle )||needle.includes( skill ) )
		if ( hit ) matched.push( tag )
		else missing.push( tag )
	}

	const considered=matched.length+missing.length
	if ( considered===0 ) return EMPTY

	return {
		score: Math.round( ( matched.length/considered )*100 ),
		matched,
		missing,
	}
}

/** "2d ago", "1w ago" — the console's units for freshness. */
export function formatAge ( date: string|Date|null,now: Date=new Date() ): string {
	if ( !date ) return '—'
	const then=typeof date==='string'? new Date( date ):date
	if ( isNaN( then.getTime() ) ) return '—'

	const days=Math.max( 0,Math.floor( ( now.getTime()-then.getTime() )/86_400_000 ) )
	if ( days===0 ) return 'today'
	if ( days===1 ) return '1d ago'
	if ( days<7 ) return `${days}d ago`
	if ( days<30 ) return `${Math.floor( days/7 )}w ago`
	return `${Math.floor( days/30 )}mo ago`
}

/** "170–195k", "150k+" — compact enough for a list row. */
export function formatSalary (
	min: number|null,
	max: number|null,
	currency: string|null
): string|null {
	const short=( value: number ) =>
		value>=1000? `${Math.round( value/1000 )}k`:String( value )

	if ( min&&max ) return `${short( min )}–${short( max )}`
	if ( min ) return `${short( min )}+`
	if ( max ) return `up to ${short( max )}`
	return currency? null:null
}
