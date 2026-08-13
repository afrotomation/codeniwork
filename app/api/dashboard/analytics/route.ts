import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { applicationEvents,companies,jobApplications } from '@/lib/db/schema'
import { eq,min } from 'drizzle-orm'
import { NextResponse } from 'next/server'

/** How many calendar months the progress list covers. */
const MONTHS_SHOWN=6

/** Stages that mean a human replied. */
const REPLIED=[ 'screening','interview','offer' ]

/** Stages that mean the application reached a real conversation. */
const ADVANCED=[ 'interview','offer' ]

const MONTH_NAMES=[
	'January','February','March','April','May','June',
	'July','August','September','October','November','December',
]

function rate ( part: number,whole: number ): number {
	return whole>0? Math.round( ( part/whole )*100 ):0
}

/**
 * Everything the analytics screen shows, computed from the user's own
 * applications. Volumes are per-user and small, so the rows are pulled once and
 * aggregated here rather than in six separate round trips.
 */
export async function GET () {
	try {
		const session=await auth()

		if ( !session?.user?.id ) {
			return NextResponse.json( { error: 'Unauthorized' },{ status: 401 } )
		}

		const userId=session.user.id

		const rows=await db
			.select( {
				id: jobApplications.id,
				status: jobApplications.status,
				appliedAt: jobApplications.appliedAt,
				companyId: companies.id,
				companyName: companies.name,
			} )
			.from( jobApplications )
			.innerJoin( companies,eq( jobApplications.companyId,companies.id ) )
			.where( eq( jobApplications.userId,userId ) )

		// First recorded event per application stands in for "when they replied".
		const firstEvents=await db
			.select( {
				applicationId: applicationEvents.applicationId,
				firstAt: min( applicationEvents.date ),
			} )
			.from( applicationEvents )
			.innerJoin( jobApplications,eq( applicationEvents.applicationId,jobApplications.id ) )
			.where( eq( jobApplications.userId,userId ) )
			.groupBy( applicationEvents.applicationId )

		const firstEventByApplication=new Map(
			firstEvents.map( event => [ event.applicationId,event.firstAt ] )
		)

		const total=rows.length
		const replied=rows.filter( row => REPLIED.includes( row.status ) ).length
		const advanced=rows.filter( row => ADVANCED.includes( row.status ) ).length
		const offers=rows.filter( row => row.status==='offer' ).length

		// Average days between applying and the first thing that happened after.
		const gaps: number[]=[]
		for ( const row of rows ) {
			const firstAt=firstEventByApplication.get( row.id )
			if ( !firstAt ) continue
			const days=( new Date( firstAt ).getTime()-new Date( row.appliedAt ).getTime() )/86_400_000
			if ( days>=0 ) gaps.push( days )
		}
		const avgDaysToReply=gaps.length>0
			? Math.round( ( gaps.reduce( ( sum,days ) => sum+days,0 )/gaps.length )*10 )/10
			:null

		const now=new Date()

		// Month buckets, oldest first, so the list reads as a progression.
		const months=Array.from( { length: MONTHS_SHOWN },( _,index ) => {
			const date=new Date( now.getFullYear(),now.getMonth()-( MONTHS_SHOWN-1-index ),1 )
			const inMonth=rows.filter( row => {
				const applied=new Date( row.appliedAt )
				return applied.getFullYear()===date.getFullYear()&&applied.getMonth()===date.getMonth()
			} )

			return {
				label: MONTH_NAMES[ date.getMonth() ],
				year: date.getFullYear(),
				applied: inMonth.length,
				interviews: inMonth.filter( row => ADVANCED.includes( row.status ) ).length,
				offers: inMonth.filter( row => row.status==='offer' ).length,
			}
		} )

		// Deltas compare this calendar month against the previous one.
		const monthRows=( offset: number ) => {
			const date=new Date( now.getFullYear(),now.getMonth()-offset,1 )
			return rows.filter( row => {
				const applied=new Date( row.appliedAt )
				return applied.getFullYear()===date.getFullYear()&&applied.getMonth()===date.getMonth()
			} )
		}

		const thisMonth=monthRows( 0 )
		const lastMonth=monthRows( 1 )

		const delta=( predicate: ( status: string ) => boolean ) =>
			rate( thisMonth.filter( r => predicate( r.status ) ).length,thisMonth.length )
			-rate( lastMonth.filter( r => predicate( r.status ) ).length,lastMonth.length )

		// Where applications stand right now — the funnel, stage by stage.
		const funnel=[ 'applied','screening','interview','offer','rejected','withdrawn' ].map( stage => ( {
			stage,
			count: rows.filter( row => row.status===stage ).length,
			share: rate( rows.filter( row => row.status===stage ).length,total ),
		} ) )

		// Companies applied to most, with how often they came back.
		const byCompany=new Map<string,{ name: string; applications: number; replied: number }>()
		for ( const row of rows ) {
			const entry=byCompany.get( row.companyId )??{ name: row.companyName,applications: 0,replied: 0 }
			entry.applications+=1
			if ( REPLIED.includes( row.status ) ) entry.replied+=1
			byCompany.set( row.companyId,entry )
		}

		const topCompanies=[ ...byCompany.values() ]
			.sort( ( a,b ) => b.applications-a.applications )
			.slice( 0,5 )
			.map( entry => ( {
				name: entry.name,
				applications: entry.applications,
				replyRate: rate( entry.replied,entry.applications ),
			} ) )

		return NextResponse.json( {
			total,
			responseRate: rate( replied,total ),
			interviewRate: rate( advanced,total ),
			offerRate: rate( offers,total ),
			avgDaysToReply,
			deltas: {
				responseRate: delta( status => REPLIED.includes( status ) ),
				interviewRate: delta( status => ADVANCED.includes( status ) ),
				offerRate: delta( status => status==='offer' ),
			},
			months,
			funnel,
			topCompanies,
		} )
	} catch ( error ) {
		console.error( 'Error fetching analytics:',error )
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}
