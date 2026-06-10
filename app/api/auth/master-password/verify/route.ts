import { auth } from '@/lib/auth'
import { verifyMasterPassword } from '@/lib/master-password'
import { NextRequest,NextResponse } from 'next/server'

export async function POST ( request: NextRequest ) {
	try {
		const session=await auth()

		if ( !session?.user?.id ) {
			return NextResponse.json( { error: 'Unauthorized' },{ status: 401 } )
		}

		const { masterPassword }=await request.json()

		if ( !masterPassword ) {
			return NextResponse.json( { error: 'Master password is required' },{ status: 400 } )
		}

		const isValid=await verifyMasterPassword( session.user.id,masterPassword )

		if ( isValid ) {
			// Store verification in session or temporary storage
			const response=NextResponse.json( { verified: true } )
			response.cookies.set( 'master-password-verified','true',{
				httpOnly: true,
				secure: process.env.NODE_ENV==='production',
				sameSite: 'strict',
				maxAge: 3600, // 1 hour
			} )
			return response
		} else {
			return NextResponse.json( { error: 'Invalid master password' },{ status: 400 } )
		}
	} catch ( error ) {
		console.error( 'Error verifying master password:',error )
		return NextResponse.json(
			{ error: 'Failed to verify master password' },
			{ status: 500 }
		)
	}
}


