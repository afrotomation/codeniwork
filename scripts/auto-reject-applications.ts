import { config } from 'dotenv'
import { and,eq,sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import { applicationEvents,companies,jobApplications } from '../lib/db/schema'

// Load environment variables
config( { path: '.env.local' } )

// Database connection
const db=drizzle( process.env.DATABASE_URL! )

async function autoRejectOldApplications () {
	const twentyOneDaysAgo=new Date()
	twentyOneDaysAgo.setDate( twentyOneDaysAgo.getDate()-21 )

	// Find applications that are still in 'applied' or 'screening' status for 21+ days
	const oldApplications=await db
		.select( {
			id: jobApplications.id,
			position: jobApplications.position,
			status: jobApplications.status,
			appliedAt: jobApplications.appliedAt,
			company: {
				name: companies.name
			}
		} )
		.from( jobApplications )
		.innerJoin( companies,eq( jobApplications.companyId,companies.id ) )
		.where(
			and(
				sql`${jobApplications.appliedAt} <= ${twentyOneDaysAgo}`,
				sql`${jobApplications.status} IN ('applied', 'screening')`
			)
		)

	if ( oldApplications.length===0 ) {
		return { rejectedCount: 0,applications: [] }
	}

	// Update all old applications to 'rejected' status
	const rejectedApplications=await db
		.update( jobApplications )
		.set( {
			status: 'rejected',
			updatedAt: new Date()
		} )
		.where(
			and(
				sql`${jobApplications.appliedAt} <= ${twentyOneDaysAgo}`,
				sql`${jobApplications.status} IN ('applied', 'screening')`
			)
		)
		.returning( {
			id: jobApplications.id,
			position: jobApplications.position,
			companyId: jobApplications.companyId
		} )

	// Create activity events for each rejected application
	for ( const app of rejectedApplications ) {
		await db
			.insert( applicationEvents )
			.values( {
				applicationId: app.id,
				type: 'auto_rejected',
				title: 'Application automatically rejected',
				description: `Application for ${app.position} was automatically rejected after 21 days without status update`,
				date: new Date(),
			} )
	}

	return {
		rejectedCount: rejectedApplications.length,
		applications: oldApplications
	}
}

async function runAutoRejection () {
	console.log( '🔄 Starting auto-rejection process...' )
	console.log( '📅 Looking for applications older than 21 days in "applied" or "screening" status...' )

	try {
		const result=await autoRejectOldApplications()

		if ( result.rejectedCount===0 ) {
			console.log( '✅ No applications found that need to be auto-rejected' )
		} else {
			console.log( `✅ Successfully auto-rejected ${result.rejectedCount} applications:` )
			result.applications.forEach( ( app,index ) => {
				console.log( `   ${index+1}. ${app.position} at ${app.company.name} (${app.status})` )
			} )
		}

		console.log( '🎉 Auto-rejection process completed successfully!' )
	} catch ( error ) {
		console.error( '❌ Error during auto-rejection process:',error )
		process.exit( 1 )
	}
}

// Run the auto-rejection function
runAutoRejection()
