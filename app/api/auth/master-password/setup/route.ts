import { auth } from '@/lib/auth'
import { storeMasterPassword } from '@/lib/master-password'
import { NextRequest,NextResponse } from 'next/server'

export async function POST ( request: NextRequest ) {
	try {
		const session=await auth()

		if ( !session?.user?.id ) {
			return NextResponse.json( { error: 'Unauthorized' },{ status: 401 } )
		}

		const { masterPassword }=await request.json()

		if ( !masterPassword||masterPassword.length<8 ) {
			return NextResponse.json(
				{ error: 'Master password must be at least 8 characters long' },
				{ status: 400 }
			)
		}

		await storeMasterPassword( session.user.id,masterPassword )

		return NextResponse.json( { success: true } )
	} catch ( error ) {
		console.error( 'Error setting up master password:',error )
		return NextResponse.json(
			{ error: 'Failed to setup master password' },
			{ status: 500 }
		)
	}
}


