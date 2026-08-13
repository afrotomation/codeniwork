import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { jsonCompletion } from '@/lib/ai'
import { db } from '@/lib/db'
import { resumeParses } from '@/lib/db/schema'
import { desc, eq } from 'drizzle-orm'

/**
 * The user's most recent resume parse. The discover screen scores jobs against
 * these skills, and the AI tools screen reopens the last parse rather than
 * making the user paste their resume again.
 */
export async function GET() {
	try {
		const session = await auth()

		if ( !session?.user?.id ) {
			return NextResponse.json( { error: 'Unauthorized' }, { status: 401 } )
		}

		const [ latest ] = await db
			.select()
			.from( resumeParses )
			.where( eq( resumeParses.userId, session.user.id ) )
			.orderBy( desc( resumeParses.createdAt ) )
			.limit( 1 )

		return NextResponse.json( latest ?? null )
	} catch ( error ) {
		console.error( 'Error fetching resume parse:', error )
		return NextResponse.json(
			{ error: 'Failed to fetch resume parse' },
			{ status: 500 }
		)
	}
}

export async function POST( request: NextRequest ) {
	try {
		const session = await auth()

		if ( !session?.user?.id ) {
			return NextResponse.json( { error: 'Unauthorized' }, { status: 401 } )
		}

		const { text } = await request.json()

		if ( !text || typeof text !== 'string' ) {
			return NextResponse.json( { error: 'Resume text is required' }, { status: 400 } )
		}

		const parsed = await jsonCompletion<{
			name?: string; email?: string; phone?: string; summary?: string
			skills?: string[]; experience?: unknown[]; education?: unknown[]
		}>([
			{
				role: 'system',
				content: 'You are a resume parser. Extract structured data from the resume text. Return JSON with: name, email, phone, summary (2-3 sentences), skills (array), experience (array of {title,company,duration,description}), education (array of {degree,school,year}).',
			},
			{ role: 'user', content: text },
		], { temperature: 0.1 })

		const [ resumeParse ] = await db.insert( resumeParses ).values( {
			userId: session.user.id,
			rawText: text,
			name: parsed.name || null,
			email: parsed.email || null,
			phone: parsed.phone || null,
			summary: parsed.summary || null,
			skills: parsed.skills || [],
			experience: parsed.experience || [],
			education: parsed.education || [],
		} ).returning()

		return NextResponse.json( resumeParse )
	} catch ( error ) {
		console.error( 'Error parsing resume:', error )
		return NextResponse.json(
			{ error: 'Failed to parse resume' },
			{ status: 500 }
		)
	}
}
