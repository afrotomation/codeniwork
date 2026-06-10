import { type NextRequest,NextResponse } from 'next/server'

const AUTH_BASE_URL=
	process.env.NEXT_PUBLIC_AUTH_URL||
	process.env.NEXT_PUBLIC_BETTER_AUTH_URL||
	'https://auth.afrotomation.com'

/**
 * Transparent proxy to CodeniServer so session cookies land first-party.
 *
 * 415 fix: Better Auth handlers parse the body as JSON; body-less POSTs
 * without a Content-Type get HTTP 415 upstream (silently breaking
 * sign-out), so we guarantee a Content-Type and `{}` body.
 */
async function handler ( request: NextRequest ) {
	const url=new URL( request.url )
	const authPath=url.pathname.replace( '/api/auth','' )
	const targetUrl=`${AUTH_BASE_URL}/api/auth${authPath}${url.search}`

	const forwardHeaders=new Headers()
	const cookie=request.headers.get( 'cookie' )
	if ( cookie ) forwardHeaders.set( 'cookie',cookie )

	// Set origin to codeniserver so CORS accepts it.
	forwardHeaders.set( 'origin',AUTH_BASE_URL )

	// Stamps sessions.client_app on codeniserver for per-app tracking and
	// scoped sign-out.
	forwardHeaders.set( 'x-client-app','codeniwork' )

	const init: RequestInit={
		method: request.method,
		headers: forwardHeaders,
		redirect: 'manual',
	}

	if ( request.method!=='GET'&&request.method!=='HEAD' ) {
		const incomingBody=await request.text()
		init.body=incomingBody

		const contentType=request.headers.get( 'content-type' )
		if ( contentType ) {
			forwardHeaders.set( 'content-type',contentType )
		} else {
			forwardHeaders.set( 'content-type','application/json' )
			if ( !incomingBody ) init.body='{}'
		}
	}

	const response=await fetch( targetUrl,init )

	const responseHeaders=new Headers()

	// getSetCookie() returns ALL set-cookie headers; get() only the first.
	const setCookies=response.headers.getSetCookie?.()||[]
	for ( const c of setCookies ) {
		responseHeaders.append( 'set-cookie',c )
	}

	const ct=response.headers.get( 'content-type' )
	if ( ct ) responseHeaders.set( 'content-type',ct )

	if ( response.status>=300&&response.status<400 ) {
		const location=response.headers.get( 'location' )
		if ( location ) {
			responseHeaders.set( 'location',location.replace( AUTH_BASE_URL,url.origin ) )
		}
		return new NextResponse( null,{
			status: response.status,
			headers: responseHeaders,
		} )
	}

	const body=await response.text()
	return new NextResponse( body,{
		status: response.status,
		headers: responseHeaders,
	} )
}

export const GET=handler
export const POST=handler
export const PUT=handler
export const PATCH=handler
export const DELETE=handler
