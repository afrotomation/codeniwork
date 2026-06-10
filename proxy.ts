import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export function proxy( request: NextRequest ) {
	// Get the pathname of the request
	const path=request.nextUrl.pathname

	// Define public paths that don't require authentication
	const publicPaths=[ '/','/auth/signin','/auth/signup' ]
	const isPublicPath=publicPaths.some( publicPath => path.startsWith( publicPath ) )

	// Check if user is authenticated (has a Better Auth session cookie set
	// by the CodeniServer proxy). Presence-only: real validation happens in
	// auth() on every server call.
	const hasSession=request.cookies.has( 'better-auth.session_token' )||
		request.cookies.has( '__Secure-better-auth.session_token' )

	// If the path is public, allow access
	if ( isPublicPath ) {
		// If user is already authenticated and trying to access auth pages, redirect to dashboard
		if ( hasSession&&( path.startsWith( '/auth/signin' )||path.startsWith( '/auth/signup' ) ) ) {
			return NextResponse.redirect( new URL( '/dashboard',request.url ) )
		}
		return NextResponse.next()
	}

	// If the path requires authentication and user is not authenticated
	if ( !hasSession ) {
		// Redirect to signin page
		const signinUrl=new URL( '/auth/signin',request.url )
		signinUrl.searchParams.set( 'callbackUrl',path )
		return NextResponse.redirect( signinUrl )
	}

	// If user is authenticated and accessing protected routes, allow access
	return NextResponse.next()
}

export const config={
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - api (API routes)
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * - public folder
		 */
		'/((?!api|_next/static|_next/image|favicon.ico|public).*)',
	],
}
