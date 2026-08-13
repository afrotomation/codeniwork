import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { applicationEvents,companies,jobApplications } from '@/lib/db/schema'
import { and,asc,eq } from 'drizzle-orm'
import { NextRequest,NextResponse } from 'next/server'
import { z } from 'zod/v4'
import { createActivityEvent } from '@/lib/db/queries'

/**
 * One application's event history, oldest first — the timeline shown when a
 * row on the applications screen is expanded.
 */
export async function GET (
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const session=await auth()

		if ( !session?.user?.id ) {
			return NextResponse.json( { error: 'Unauthorized' },{ status: 401 } )
		}

		const { id: applicationId }=await params

		// Scope the lookup to the session user so an id alone reveals nothing.
		const [ application ]=await db
			.select( {
				id: jobApplications.id,
				appliedAt: jobApplications.appliedAt,
			} )
			.from( jobApplications )
			.where( and(
				eq( jobApplications.id,applicationId ),
				eq( jobApplications.userId,session.user.id )
			) )
			.limit( 1 )

		if ( !application ) {
			return NextResponse.json(
				{ error: 'Application not found or access denied' },
				{ status: 404 }
			)
		}

		const events=await db
			.select( {
				id: applicationEvents.id,
				type: applicationEvents.type,
				title: applicationEvents.title,
				description: applicationEvents.description,
				date: applicationEvents.date,
			} )
			.from( applicationEvents )
			.where( eq( applicationEvents.applicationId,applicationId ) )
			.orderBy( asc( applicationEvents.date ) )

		return NextResponse.json( { events } )
	} catch ( error ) {
		console.error( 'Error fetching application events:',error )
		return NextResponse.json(
			{ error: 'Failed to fetch application events' },
			{ status: 500 }
		)
	}
}

// Validation schema for updating job applications
const updateApplicationSchema=z.object( {
	companyName: z.string().min( 1,'Company name is required' ),
	position: z.string().min( 1,'Position is required' ),
	jobUrl: z.string().url( 'Please enter a valid URL' ).optional().or( z.literal( '' ) ),
	location: z.string().min( 1,'Location is required' ),
	salary: z.string().optional(),
	notes: z.string().optional(),
	priority: z.enum( [ 'low','medium','high' ] ),
	isRemote: z.boolean().default( false ),
	status: z.enum( [ 'applied','screening','interview','offer','rejected','withdrawn' ] ),
	deadline: z.string().optional(),
} )

export async function PUT (
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		// Get the authenticated user session
		const session=await auth()

		if ( !session?.user?.id ) {
			return NextResponse.json( { error: 'Unauthorized' },{ status: 401 } )
		}

		const { id: applicationId }=await params

		if ( !applicationId ) {
			return NextResponse.json( { error: 'Application ID is required' },{ status: 400 } )
		}

		// Parse and validate the request body
		const body=await request.json()
		const validatedData=updateApplicationSchema.parse( body )

		// First, check if the application exists and belongs to the user
		const existingApplication=await db
			.select()
			.from( jobApplications )
			.where(
				and(
					eq( jobApplications.id,applicationId ),
					eq( jobApplications.userId,session.user.id )
				)
			)
			.limit( 1 )

		if ( existingApplication.length===0 ) {
			return NextResponse.json(
				{ error: 'Application not found or access denied' },
				{ status: 404 }
			)
		}

		const currentApp=existingApplication[ 0 ]

		// Check if company exists, if not create it
		let companyId=currentApp.companyId
		const existingCompany=await db
			.select()
			.from( companies )
			.where( eq( companies.name,validatedData.companyName ) )
			.limit( 1 )

		if ( existingCompany.length===0 ) {
			// Create new company
			const [ newCompany ]=await db
				.insert( companies )
				.values( {
					name: validatedData.companyName,
					website: validatedData.jobUrl||null,
				} )
				.returning()

			companyId=newCompany.id
		} else {
			companyId=existingCompany[ 0 ].id
		}

		// Prepare deadline date
		let deadlineDate=null
		if ( validatedData.deadline ) {
			deadlineDate=new Date( validatedData.deadline )
			if ( isNaN( deadlineDate.getTime() ) ) {
				return NextResponse.json(
					{ error: 'Invalid deadline date format' },
					{ status: 400 }
				)
			}
		}

		// Update the job application
		const [ updatedApplication ]=await db
			.update( jobApplications )
			.set( {
				companyId: companyId,
				position: validatedData.position,
				status: validatedData.status,
				priority: validatedData.priority,
				salary: validatedData.salary||null,
				location: validatedData.location,
				jobUrl: validatedData.jobUrl||null,
				notes: validatedData.notes||null,
				isRemote: validatedData.isRemote,
				deadline: deadlineDate,
				updatedAt: new Date(),
			} )
			.where( eq( jobApplications.id,applicationId ) )
			.returning()

		if ( !updatedApplication ) {
			return NextResponse.json(
				{ error: 'Failed to update application' },
				{ status: 500 }
			)
		}

		// Create activity event for the application update
		const statusChanged = currentApp.status !== validatedData.status
		const companyChanged = currentApp.companyId !== companyId
		const positionChanged = currentApp.position !== validatedData.position

		if (statusChanged) {
			await createActivityEvent(
				applicationId,
				'status_updated',
				`Status changed to ${validatedData.status}`,
				`Application status updated from ${currentApp.status} to ${validatedData.status} for ${validatedData.position} at ${validatedData.companyName}`
			)
		}

		if (companyChanged) {
			await createActivityEvent(
				applicationId,
				'company_changed',
				`Company changed to ${validatedData.companyName}`,
				`Company changed for ${validatedData.position} position to ${validatedData.companyName}`
			)
		}

		if (positionChanged) {
			await createActivityEvent(
				applicationId,
				'position_updated',
				`Position updated to ${validatedData.position}`,
				`Position title updated to ${validatedData.position} at ${validatedData.companyName}`
			)
		}

		// If no major changes, create a general update activity
		if (!statusChanged && !companyChanged && !positionChanged) {
			await createActivityEvent(
				applicationId,
				'application_updated',
				`Application details updated`,
				`General application details updated for ${validatedData.position} at ${validatedData.companyName}`
			)
		}

		// Return the updated application with company details
		const result=await db
			.select( {
				id: jobApplications.id,
				position: jobApplications.position,
				status: jobApplications.status,
				priority: jobApplications.priority,
				salary: jobApplications.salary,
				location: jobApplications.location,
				jobUrl: jobApplications.jobUrl,
				notes: jobApplications.notes,
				appliedAt: jobApplications.appliedAt,
				deadline: jobApplications.deadline,
				isRemote: jobApplications.isRemote,
				company: {
					id: companies.id,
					name: companies.name,
					logo: companies.logo,
					website: companies.website,
				},
			} )
			.from( jobApplications )
			.innerJoin( companies,eq( jobApplications.companyId,companies.id ) )
			.where( eq( jobApplications.id,applicationId ) )
			.limit( 1 )

		return NextResponse.json( result[ 0 ] )
	} catch ( error ) {
		console.error( 'Error updating job application:',error )

		if ( error instanceof z.ZodError ) {
			return NextResponse.json(
				{ error: 'Validation error',details: error.issues },
				{ status: 400 }
			)
		}

		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}
